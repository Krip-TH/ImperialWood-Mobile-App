const PRODUCT_IMAGE_DIRECTORY = 'assets/products';
const GITHUB_API_VERSION = '2026-03-10';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

let uploadQueue = Promise.resolve();

function apiError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeImageFileName(fileName) {
  const name = String(fileName || '').trim().replace(/^.*[\\/]/, '');
  const extensionMatch = /\.(jpe?g|png|webp)$/i.exec(name);

  if (!extensionMatch) {
    throw apiError('Please choose a JPG, JPEG, PNG, or WEBP image.', 400);
  }

  const extension = extensionMatch[1].toLowerCase();
  const baseName = name
    .slice(0, -extensionMatch[0].length)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!baseName) throw apiError('The selected image filename is invalid.', 400);
  return `${baseName}.${extension}`;
}

function availableFileName(normalizedFileName, existingNames) {
  const existing = new Set(existingNames.map((name) => String(name).toLowerCase()));
  if (!existing.has(normalizedFileName)) return normalizedFileName;

  const extensionIndex = normalizedFileName.lastIndexOf('.');
  const baseName = normalizedFileName.slice(0, extensionIndex);
  const extension = normalizedFileName.slice(extensionIndex);
  let suffix = 2;

  while (existing.has(`${baseName}-${suffix}${extension}`)) suffix += 1;
  return `${baseName}-${suffix}${extension}`;
}

function githubConfiguration() {
  const configuration = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repository: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH,
  };
  const missing = Object.entries(configuration)
    .filter(([, value]) => !String(value || '').trim())
    .map(([key]) => key);

  if (missing.length > 0) {
    throw apiError('GitHub image upload is not configured.', 503);
  }

  return configuration;
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'ImperialWood-Backend',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  };
}

function contentsApiUrl(path, configuration) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const owner = encodeURIComponent(configuration.owner);
  const repository = encodeURIComponent(configuration.repository);
  return `https://api.github.com/repos/${owner}/${repository}/contents/${encodedPath}`;
}

async function existingProductImageNames(configuration) {
  const response = await fetch(
    `${contentsApiUrl(PRODUCT_IMAGE_DIRECTORY, configuration)}?ref=${encodeURIComponent(configuration.branch)}`,
    { headers: githubHeaders(configuration.token) }
  );

  if (!response.ok) {
    throw apiError(
      response.status === 401 || response.status === 403
        ? 'GitHub image upload authorization failed.'
        : 'The GitHub product image directory could not be checked.',
      502
    );
  }

  const entries = await response.json();
  if (!Array.isArray(entries)) {
    throw apiError('The GitHub product image directory is invalid.', 502);
  }
  return entries.filter((entry) => entry?.type === 'file').map((entry) => entry.name);
}

function validateBase64Image(contentBase64) {
  const content = String(contentBase64 || '').replace(/^data:[^;]+;base64,/, '');
  if (!content || !/^[A-Za-z0-9+/]+={0,2}$/.test(content)) {
    throw apiError('The selected image data is invalid.', 400);
  }

  const size = Buffer.from(content, 'base64').length;
  if (size === 0 || size > MAX_IMAGE_BYTES) {
    throw apiError('The product image must be 6 MB or smaller.', 400);
  }
  return content;
}

async function performUpload(image) {
  const configuration = githubConfiguration();
  const normalizedFileName = normalizeImageFileName(image?.file_name);
  const mimeType = String(image?.mime_type || '').toLowerCase();
  if (
    mimeType &&
    !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)
  ) {
    throw apiError('Please choose a JPG, JPEG, PNG, or WEBP image.', 400);
  }
  const content = validateBase64Image(image?.content_base64);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const existingNames = await existingProductImageNames(configuration);
    const fileName = availableFileName(normalizedFileName, existingNames);
    const repositoryPath = `${PRODUCT_IMAGE_DIRECTORY}/${fileName}`;
    const response = await fetch(contentsApiUrl(repositoryPath, configuration), {
      method: 'PUT',
      headers: githubHeaders(configuration.token),
      body: JSON.stringify({
        message: `Add product image ${fileName}`,
        content,
        branch: configuration.branch,
      }),
    });

    if (response.status === 201) {
      const owner = encodeURIComponent(configuration.owner);
      const repository = encodeURIComponent(configuration.repository);
      const branch = configuration.branch.split('/').map(encodeURIComponent).join('/');
      return `https://raw.githubusercontent.com/${owner}/${repository}/refs/heads/${branch}/${repositoryPath}`;
    }
    if ((response.status === 409 || response.status === 422) && attempt < 3) {
      continue;
    }
    throw apiError(
      response.status === 401 || response.status === 403
        ? 'GitHub image upload authorization failed.'
        : 'The product image could not be uploaded to GitHub.',
      502
    );
  }

  throw apiError('The product image could not be uploaded to GitHub.', 502);
}

function uploadProductImage(image) {
  const operation = uploadQueue.then(() => performUpload(image));
  uploadQueue = operation.catch(() => undefined);
  return operation;
}

module.exports = {
  availableFileName,
  normalizeImageFileName,
  uploadProductImage,
};
