#!/usr/bin/env python3
"""Export documents JSON into a formatted PDF report."""

import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

import requests
from PIL import Image, UnidentifiedImageError
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, StyleSheet1, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image as RLImage,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    TableOfContents,
)
from xml.sax.saxutils import escape

PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT_MARGIN = RIGHT_MARGIN = 20 * mm
TOP_MARGIN = 20 * mm
BOTTOM_MARGIN = 20 * mm
CACHE_DIR_NAME = 'cache'
IMAGE_MAX_HEIGHT = 140 * mm
IMAGE_MAX_WIDTH = (PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN) / 2 - 6
REMOTE_TIMEOUT = (5, 15)
REMOTE_RETRIES = 2
SUPPORTED_OUTPUT_FORMATS = {'.png', '.jpg', '.jpeg'}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Export documents JSON into PDF.')
    parser.add_argument('--input', default='documents.json', help='Path to documents.json input file')
    parser.add_argument('--output', default=os.path.join('output', 'documents.pdf'), help='Destination PDF path')
    return parser.parse_args()


def ensure_directory(path: str) -> None:
    if path:
        os.makedirs(path, exist_ok=True)


def load_documents(path: str) -> List[Dict[str, Any]]:
    with open(path, 'r', encoding='utf-8') as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError('documents.json must contain a list of documents')
    documents = []
    for entry in data:
        if isinstance(entry, dict):
            documents.append(entry)
    documents.sort(key=document_sort_key)
    return documents


def document_sort_key(doc: Dict[str, Any]) -> Any:
    year = doc.get('year')
    try:
        year_value = int(year)
        missing = 0
    except (TypeError, ValueError):
        year_value = 0
        missing = 1
    title = doc.get('title', '')
    return (missing, year_value, title.lower())


def normalize_text(value: Any) -> str:
    if isinstance(value, list):
        return '\n'.join(str(item) for item in value)
    if isinstance(value, str):
        return value
    return ''


def human_datetime(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M')
    except ValueError:
        return value


def hash_key(content: str) -> str:
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def cached_remote_path(url: str, cache_dir: str) -> str:
    suffix = os.path.splitext(url.split('?')[0].rstrip('/'))[1].lower()
    if suffix not in SUPPORTED_OUTPUT_FORMATS:
        suffix = '.png'
    filename = f"{hash_key(url)}{suffix}"
    return os.path.join(cache_dir, filename)


def download_remote_image(url: str, cache_dir: str) -> str:
    ensure_directory(cache_dir)
    destination = cached_remote_path(url, cache_dir)
    if os.path.exists(destination):
        return destination
    last_error: Optional[Exception] = None
    for attempt in range(REMOTE_RETRIES):
        try:
            response = requests.get(url, timeout=REMOTE_TIMEOUT)
            response.raise_for_status()
            with open(destination, 'wb') as handle:
                handle.write(response.content)
            return destination
        except requests.RequestException as exc:
            last_error = exc
            time.sleep(1)
    raise RuntimeError(f'Failed to download image: {url} ({last_error})')


def resolve_local_image(path: str, base_dir: str) -> str:
    candidate = path
    if not os.path.isabs(candidate):
        candidate = os.path.join(base_dir, candidate)
    if not os.path.exists(candidate):
        raise FileNotFoundError(f'Image not found: {path}')
    return candidate


def prepare_image_file(source: str, cache_dir: str) -> str:
    try:
        with Image.open(source) as img:
            fmt = (img.format or '').upper()
            if fmt == 'WEBP' or os.path.splitext(source)[1].lower() not in SUPPORTED_OUTPUT_FORMATS:
                ensure_directory(cache_dir)
                converted = os.path.join(cache_dir, f"{hash_key(source)}.png")
                if not os.path.exists(converted):
                    rgb = img.convert('RGB')
                    rgb.save(converted, format='PNG')
                return converted
    except (UnidentifiedImageError, OSError) as exc:
        raise RuntimeError(f'Could not process image: {source} ({exc})') from exc
    return source


def fetch_image(path_or_url: str, base_dir: str, cache_dir: str) -> str:
    if path_or_url.startswith(('http://', 'https://')):
        downloaded = download_remote_image(path_or_url, cache_dir)
        return prepare_image_file(downloaded, cache_dir)
    resolved = resolve_local_image(path_or_url, base_dir)
    return prepare_image_file(resolved, cache_dir)


def create_styles() -> StyleSheet1:
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='DocTitle', parent=styles['Heading1'], fontName='Times-Bold', fontSize=20, spaceAfter=8))
    styles.add(ParagraphStyle(name='MetaHeading', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#555555'), spaceAfter=4))
    styles.add(ParagraphStyle(name='Body', parent=styles['Normal'], fontSize=11, leading=15, alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='SectionHeading', parent=styles['Heading3'], fontSize=14, spaceBefore=12, spaceAfter=6))
    styles.add(ParagraphStyle(name='Bullet', parent=styles['Body'], leftIndent=12, bulletIndent=6))
    return styles


class DocHeading(Paragraph):
    def __init__(self, text: str, style: ParagraphStyle, toc_text: str) -> None:
        super().__init__(text, style)
        self.is_doc_title = True
        self.toc_text = toc_text


class ReportDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(filename, pagesize=A4, leftMargin=LEFT_MARGIN, rightMargin=RIGHT_MARGIN, topMargin=TOP_MARGIN, bottomMargin=BOTTOM_MARGIN)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id='normal')
        template = PageTemplate(id='default', frames=frame, onPage=self.draw_footer)
        self.addPageTemplates([template])

    @staticmethod
    def draw_footer(canvas, doc) -> None:  # type: ignore[override]
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.drawCentredString(PAGE_WIDTH / 2, 12 * mm, str(canvas.getPageNumber()))
        canvas.restoreState()

    def afterFlowable(self, flowable):  # type: ignore[override]
        if getattr(flowable, 'is_doc_title', False):
            text = getattr(flowable, 'toc_text', '')
            self.notify('TOCEntry', (0, text, self.page))


def build_metadata_table(doc: Dict[str, Any], styles: StyleSheet1) -> Table:
    metadata = doc.get('metadata') or {}
    review = doc.get('review') or {}
    rows = [
        ['Author', metadata.get('author', 'N/A')],
        ['Source', metadata.get('source', 'N/A')],
        ['Condition', metadata.get('condition', 'N/A')],
    ]
    status = review.get('status')
    reviewer = review.get('reviewer')
    reviewed_at = human_datetime(review.get('reviewedAt'))
    if status or reviewer or reviewed_at:
        details = ', '.join(filter(None, [status, reviewer, reviewed_at])) or 'N/A'
        rows.append(['Review', details])
    table = Table(rows, colWidths=[30 * mm, 115 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f5f5f5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#333333')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#999999')),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#cccccc')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return table


def paragraph_from_text(text: str, style: ParagraphStyle) -> Paragraph:
    safe_text = escape(text).replace('\n', '<br/>')
    return Paragraph(safe_text, style)


def build_review_comments(doc: Dict[str, Any], styles: StyleSheet1) -> Optional[ListFlowable]:
    review = doc.get('review') or {}
    comments = review.get('comments') or []
    if not comments:
        return None
    items: List[ListItem] = []
    for entry in comments:
        reviewer = entry.get('reviewer', 'Unknown')
        date_text = human_datetime(entry.get('date')) or 'Unknown date'
        comment_text = entry.get('comment', '').strip()
        body = f"<b>{escape(str(reviewer))}</b> ({escape(str(date_text))})<br/>{escape(comment_text)}"
        items.append(ListItem(Paragraph(body, styles['Body']), leftIndent=12))
    return ListFlowable(items, bulletType='bullet', start='circle', leftIndent=18)


def build_image_table(doc: Dict[str, Any], base_dir: str, cache_dir: str, styles: StyleSheet1) -> Optional[Table]:
    images = doc.get('images') or []
    if not images:
        return None
    rows: List[List[Any]] = []
    current_row: List[Any] = []
    for url in images:
        try:
            image_path = fetch_image(str(url), base_dir, cache_dir)
            img_flow = RLImage(image_path)
            img_flow._restrictSize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT)
        except Exception:
            placeholder = paragraph_from_text(f'[Image could not be loaded: {url}]', styles['Body'])
            img_flow = placeholder
        current_row.append(img_flow)
        if len(current_row) == 2:
            rows.append(current_row)
            current_row = []
    if current_row:
        if len(current_row) == 1:
            current_row.append(Spacer(IMAGE_MAX_WIDTH, 0))
        rows.append(current_row)
    table = Table(rows, colWidths=[IMAGE_MAX_WIDTH, IMAGE_MAX_WIDTH], hAlign='LEFT')
    table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return table


def document_story(doc: Dict[str, Any], styles: StyleSheet1, base_dir: str, cache_dir: str) -> List[Any]:
    flows: List[Any] = []
    title = doc.get('title', 'Untitled Document')
    year = doc.get('year')
    year_text = f"{year}" if year not in (None, '') else 'n/a'
    subtitle_parts = [f"Year: {year_text}"]
    if doc.get('category'):
        cat = doc['category']
        subcat = doc.get('subcategory') or ', '.join(doc.get('subcategories', []) or [])
        if subcat:
            subtitle_parts.append(f"Category: {cat} / {subcat}")
        else:
            subtitle_parts.append(f"Category: {cat}")
    if doc.get('location'):
        subtitle_parts.append(f"Location: {doc['location']}")
    subtitle_parts.append(f"ID: {doc.get('id', '')}")
    subtitle = ' | '.join(subtitle_parts)
    toc_label = f"{title} ({year_text})"
    heading = DocHeading(escape(title), styles['DocTitle'], toc_label)
    flows.append(heading)
    flows.append(Paragraph(escape(subtitle), styles['MetaHeading']))
    flows.append(Spacer(1, 6))
    flows.append(build_metadata_table(doc, styles))
    description = normalize_text(doc.get('description'))
    if description:
        flows.append(Paragraph('Description', styles['SectionHeading']))
        flows.append(paragraph_from_text(description, styles['Body']))
    transcription = normalize_text(doc.get('transcription'))
    if transcription:
        flows.append(Paragraph('Transcription', styles['SectionHeading']))
        flows.append(paragraph_from_text(transcription, styles['Body']))
    comments_flow = build_review_comments(doc, styles)
    if comments_flow:
        flows.append(Paragraph('Review Comments', styles['SectionHeading']))
        flows.append(comments_flow)
    image_table = build_image_table(doc, base_dir, cache_dir, styles)
    if image_table:
        flows.append(Paragraph('Images', styles['SectionHeading']))
        flows.append(image_table)
    return flows


def build_story(documents: Sequence[Dict[str, Any]], styles: StyleSheet1, base_dir: str, cache_dir: str) -> List[Any]:
    story: List[Any] = []
    toc_title = Paragraph('Table of Contents', styles['DocTitle'])
    story.append(toc_title)
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle(name='TOCHeading', fontName='Helvetica', fontSize=12, leftIndent=20, firstLineIndent=-20, spaceAfter=4)]
    story.append(toc)
    story.append(Spacer(1, 12))
    story.append(PageBreak())
    for index, doc in enumerate(documents):
        story.extend(document_story(doc, styles, base_dir, cache_dir))
        if index != len(documents) - 1:
            story.append(PageBreak())
    return story


def build_pdf(documents: Sequence[Dict[str, Any]], output_path: str, base_dir: str) -> None:
    ensure_directory(os.path.dirname(output_path))
    cache_dir = os.path.join(os.path.dirname(output_path) or '.', CACHE_DIR_NAME)
    ensure_directory(cache_dir)
    styles = create_styles()
    story = build_story(documents, styles, base_dir, cache_dir)
    template = ReportDocTemplate(output_path)
    template.build(story)


def main() -> None:
    args = parse_args()
    input_path = os.path.abspath(args.input)
    output_path = os.path.abspath(args.output)
    base_dir = os.path.dirname(input_path) or '.'
    try:
        documents = load_documents(input_path)
    except Exception as exc:  # noqa: BLE001
        print(f'Failed to load documents: {exc}', file=sys.stderr)
        sys.exit(1)
    if not documents:
        print('No documents to export.', file=sys.stderr)
        sys.exit(1)
    try:
        build_pdf(documents, output_path, base_dir)
    except Exception as exc:  # noqa: BLE001
        print(f'Failed to generate PDF: {exc}', file=sys.stderr)
        sys.exit(1)
    print(f'PDF generated at {output_path}')


if __name__ == '__main__':
    main()
