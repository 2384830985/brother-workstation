const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')
const tar = require('tar')
const { downloadWithRedirects } = require('./download.cjs')

// Base URL for downloading uv binaries
const UV_RELEASE_BASE_URL = 'https://github.com/astral-sh/uv/releases/download'

// const BUN_RELEASE_BASE_URL = 'https://github.com/oven-sh/bun/releases/download'
const DEFAULT_UV_VERSION = '0.7.16'

// Mapping of platform+arch to binary package name
const UV_PACKAGES = {
  'darwin-arm64': 'uv-aarch64-apple-darwin.tar.gz',
  'darwin-x64': 'uv-x86_64-apple-darwin.tar.gz',
  'win32-arm64': 'uv-aarch64-pc-windows-msvc.tar.gz',
  'win32-ia32': 'uv-i686-pc-windows-msvc.tar.gz',
  'win32-x64': 'uv-x86_64-pc-windows-msvc.tar.gz',
  'linux-arm64': 'uv-aarch64-unknown-linux-gnu.tar.gz',
  'linux-ia32': 'uv-i686-unknown-linux-gnu.tar.gz',
  'linux-ppc64': 'uv-powerpc64-unknown-linux-gnu.tar.gz',
  'linux-ppc64le': 'uv-powerpc64le-unknown-linux-gnu.tar.gz',
  'linux-s390x': 'uv-s390x-unknown-linux-gnu.tar.gz',
  'linux-x64': 'uv-x86_64-unknown-linux-gnu.tar.gz',
  'linux-armv7l': 'uv-armv7-unknown-linux-gnueabihf.tar.gz',
  // MUSL variants
  'linux-musl-arm64': 'uv-aarch64-unknown-linux-musl.tar.gz',
  'linux-musl-ia32': 'uv-i686-unknown-linux-musl.tar.gz',
  'linux-musl-x64': 'uv-x86_64-unknown-linux-musl.tar.gz',
  'linux-musl-armv6l': 'uv-arm-unknown-linux-musleabihf.tar.gz',
  'linux-musl-armv7l': 'uv-armv7-unknown-linux-musleabihf.tar.gz',
}

/**
 * Downloads and extracts the uv binary for the specified platform and architecture
 * @param {string} platform Platform to download for (e.g., 'darwin', 'win32', 'linux')
 * @param {string} arch Architecture to download for (e.g., 'x64', 'arm64')
 * @param {string} version Version of uv to download
 * @param {boolean} isMusl Whether to use MUSL variant for Linux
 */
async function downloadUvBinary(platform, arch, version = DEFAULT_UV_VERSION, isMusl = false) {
  const platformKey = isMusl ? `${platform}-musl-${arch}` : `${platform}-${arch}`
  const packageName = UV_PACKAGES[platformKey]

  if (!packageName) {
    console.error(`No binary available for ${platformKey}`)
    return false
  }

  // Create output directory structure
  const binDir = path.join(os.homedir(), '.bigBrother', 'bin')
  // Ensure directories exist
  fs.mkdirSync(binDir, { recursive: true })

  // Download URL for the specific binary
  const downloadUrl = `${UV_RELEASE_BASE_URL}/${version}/${packageName}`
  const tempdir = os.tmpdir()
  const tempFilename = path.join(tempdir, packageName)

  try {
    console.log(`Downloading uv ${version} for ${platformKey}...`)
    console.log(`URL: ${downloadUrl}`)

    await downloadWithRedirects(downloadUrl, tempFilename)

    console.log(`Extracting ${packageName} to ${binDir}...`)

    // Extract tar.gz file
    await tar.extract({
      file: tempFilename,
      cwd: binDir,
      strip: 1, // Remove the top-level directory from the archive
      filter: (path, entry) => {
        // Only extract files, not directories
        return entry.type === 'File'
      },
      onentry: (entry) => {
        console.log(`Extracting ${entry.path}`)
      },
    })

    // Make executable files executable on Unix-like systems
    if (platform !== 'win32') {
      const files = fs.readdirSync(binDir)
      for (const file of files) {
        const filePath = path.join(binDir, file)
        try {
          fs.chmodSync(filePath, 0o755)
          console.log(`Set executable permissions on ${file}`)
        } catch (chmodError) {
          console.error(`Warning: Failed to set executable permissions on ${file}`)
        }
      }
    }
    fs.unlinkSync(tempFilename)
    console.log(`Successfully installed uv ${version} for ${platform}-${arch}`)
    return true
  } catch (error) {
    console.error(`Error installing uv for ${platformKey}: ${error.message}`)

    if (fs.existsSync(tempFilename)) {
      fs.unlinkSync(tempFilename)
    }

    // Check if binDir is empty and remove it if so
    try {
      const files = fs.readdirSync(binDir)
      if (files.length === 0) {
        fs.rmSync(binDir, { recursive: true })
        console.log(`Removed empty directory: ${binDir}`)
      }
    } catch (cleanupError) {
      console.warn(`Warning: Failed to clean up directory: ${cleanupError.message}`)
    }

    return false
  }
}

/**
 * Detects current platform and architecture
 */
function detectPlatformAndArch() {
  const platform = os.platform()
  const arch = os.arch()
  const isMusl = platform === 'linux' && detectIsMusl()

  return { platform, arch, isMusl }
}

/**
 * Attempts to detect if running on MUSL libc
 */
function detectIsMusl() {
  try {
    // Simple check for Alpine Linux which uses MUSL
    const output = execSync('cat /etc/os-release').toString()
    return output.toLowerCase().includes('alpine')
  } catch (error) {
    return false
  }
}

/**
 * Main function to install uv
 */
async function installUv() {
  // Get the latest version if no specific version is provided
  const version = DEFAULT_UV_VERSION
  console.log(`Using uv version: ${version}`)

  const { platform, arch, isMusl } = detectPlatformAndArch()

  console.log(`Installing uv ${version} for ${platform}-${arch}${isMusl ? ' (MUSL)' : ''}...`)

  await downloadUvBinary(platform, arch, version, isMusl)
}

// Run the installation
installUv()
  .then(() => {
    console.log('Installation successful')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Installation failed:', error)
    process.exit(1)
  })
