import {manifest, version} from '@parcel/service-worker';

async function install() {
    let filteredManifest = []
    const cache = await caches.open(version)

    for (let i = 0; i < manifest.length; i += 1) {
        const index = manifest[i].indexOf("/error")

        if (index === -1) {
            filteredManifest.push(manifest[i])
        }
    }

    filteredManifest.push("/index.html?local=1")

    await cache.addAll(filteredManifest)
}

addEventListener('install', e => e.waitUntil(install()))

async function activate() {
    const keys = await caches.keys()

    await Promise.all(
        keys.map(key => key !== version && caches.delete(key))
    );
}

addEventListener('activate', e => e.waitUntil(activate()))

addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(function(response) {
            return response || fetch(e.request)
        })
    )
})
