import axios from "axios";
import crypto from "crypto";

const FLICKR_ENDPOINT = "https://api.flickr.com/services/rest";

const serializeParams = (params) =>
  Object.entries(params)
    .sort(([aKey], [bKey]) => (aKey < bKey ? -1 : aKey > bKey ? 1 : 0))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");

const buildSignedUrl = ({
  apiKey,
  apiSecret,
  oauthToken,
  oauthTokenSecret,
  text,
  userId,
}) => {
  const baseParams = {
    method: "flickr.photos.search",
    text,
    format: "json",
    nojsoncallback: "1",
    extras: "url_l,url_m,owner_name",
    per_page: "24",

    // 🔥 WICHTIG für private Bilder
    privacy_filter: "5",

    content_type: "1",
    sort: "relevance",
  };

  if (userId) {
    baseParams.user_id = userId;
  }

  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: oauthToken,
    oauth_version: "1.0",
  };

  const allParams = { ...baseParams, ...oauthParams };

  const paramString = serializeParams(allParams);

  const baseString = `GET&${encodeURIComponent(FLICKR_ENDPOINT)}&${encodeURIComponent(paramString)}`;

  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(oauthTokenSecret)}`;

  const oauthSignature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  const signedParams = {
    ...allParams,
    oauth_signature: oauthSignature,
  };

  return `${FLICKR_ENDPOINT}?${serializeParams(signedParams)}`;
};

const mapPhoto = (photo) => {
  const url = photo.url_l || photo.url_m;

  if (!url) return null;

  return {
    url,

    title: photo.title || "Unbenannt",

    author: photo.ownername || "Unbekannt",
  };
};

export const searchFlickrOth = async (req, res) => {
  const query = (req.query.q || "").trim();

  if (!query)
    return res.status(400).json({
      message: "Parameter q ist erforderlich.",
    });

  try {
    const response = await axios.get(
      buildSignedUrl({
        apiKey: process.env.FLICKR_API_KEY,

        apiSecret: process.env.FLICKR_API_SECRET,

        oauthToken: process.env.FLICKR_OAUTH_TOKEN,

        oauthTokenSecret: process.env.FLICKR_OAUTH_TOKEN_SECRET,

        text: query,

        userId: process.env.FLICKR_DEFAULT_USER_ID,
      }),

      { timeout: 8000 },
    );

    const photos = response.data?.photos?.photo || [];

    res.json(photos.map(mapPhoto).filter(Boolean));
  } catch (error) {
    console.error("Flickr full error:", error.response?.data || error.message);

    res.status(502).json({
      message: "Flickr search failed.",
    });
  }
};

export const searchFlickr = async (req, res) => {

  try {

    const response = await axios.get(

      'https://api.flickr.com/services/rest/',

      {
        params: {

          method: 'flickr.photos.search',

          api_key: process.env.FLICKR_API_KEY,

          text: req.query.q,

          format: 'json',

          nojsoncallback: 1,

          extras: 'url_l,owner_name',

          per_page: 24
        }
      }
    );

    res.json(
      response.data.photos.photo.map(photo => ({

        url: photo.url_l,

        title: photo.title,

        author: photo.ownername
      }))
    );

  }

  catch(error){

    console.error(error.response?.data || error.message);

    res.status(500).json({ message: "error"});
  }
};