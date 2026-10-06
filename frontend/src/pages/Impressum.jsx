const Impressum = () => (
    <div className="container mx-auto px-4 py-12 max-w-3xl text-ink">
        <h1 className="text-4xl font-serif font-bold mb-8">Impressum</h1>
        <div className="space-y-8 leading-relaxed">
            <section aria-labelledby="betreiber">
                <h2 id="betreiber" className="text-2xl font-serif font-bold mb-3">Betreiber der Website „Historisches Wald“</h2>
                <address className="not-italic">
                    Matthias Lehmann<br />
                    Brauereistrasse 5<br />
                    88639 Wald<br />
                    Deutschland
                </address>
            </section>
            <section aria-labelledby="kontakt">
                <h2 id="kontakt" className="text-2xl font-serif font-bold mb-3">Kontakt</h2>
                <p>E-Mail: kontakt (at) historisches-wald.de</p>
                <p>Mobil: <a href="tel:+4915229290038" className="underline hover:no-underline">01522 9290038</a></p>
            </section>
            <section aria-labelledby="verantwortlich">
                <h2 id="verantwortlich" className="text-2xl font-serif font-bold mb-3">Verantwortlich für journalistisch-redaktionelle Inhalte</h2>
                <p className="mb-3">Gemäß § 18 Abs. 2 Medienstaatsvertrag (MStV):</p>
                <address className="not-italic">
                    Matthias Lehmann<br />
                    Brauereistrasse 5<br />
                    88639 Wald<br />
                    Deutschland
                </address>
            </section>
        </div>
    </div>
);

export default Impressum;
