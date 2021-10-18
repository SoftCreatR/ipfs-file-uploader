'use strict'

const IPFS = require('ipfs-http-client')

const DOM = {
    accept: () => document.getElementById("accept"),
    upload: () => document.getElementById("upload"),
    main: () => document.getElementById("main"),
    uploadStatus: () => document.getElementById("uploadStatus"),
    spinner: () => document.getElementById("spinner"),
    downloadLinks: () => document.getElementById("downloadLinks")
}

const icons = {
    copy: (classList) => '<svg class="icon' + (classList ? ' ' + classList : '') + '" viewBox="0 0 448 512"><path d="M433.941 65.941l-51.882-51.882A48 48 0 0 0 348.118 0H176c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48v-48h80c26.51 0 48-21.49 48-48V99.882a48 48 0 0 0-14.059-33.941zM352 32.491a15.88 15.88 0 0 1 7.431 4.195l51.882 51.883A15.885 15.885 0 0 1 415.508 96H352V32.491zM288 464c0 8.822-7.178 16-16 16H48c-8.822 0-16-7.178-16-16V144c0-8.822 7.178-16 16-16h80v240c0 26.51 21.49 48 48 48h112v48zm128-96c0 8.822-7.178 16-16 16H176c-8.822 0-16-7.178-16-16V48c0-8.822 7.178-16 16-16h144v72c0 13.2 10.8 24 24 24h72v240z"/></svg>',
    check: (classList) => '<svg class="icon' + (classList ? ' ' + classList : '') + '" viewBox="0 0 448 512"><path d="M413.505 91.951L133.49 371.966l-98.995-98.995c-4.686-4.686-12.284-4.686-16.971 0L6.211 284.284c-4.686 4.686-4.686 12.284 0 16.971l118.794 118.794c4.686 4.686 12.284 4.686 16.971 0l299.813-299.813c4.686-4.686 4.686-12.284 0-16.971l-11.314-11.314c-4.686-4.686-12.284-4.686-16.97 0z"/></svg>',
    times: (classList) => '<svg class="icon' + (classList ? ' ' + classList : '') + '" viewBox="0 0 320 512"><path d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z"/></svg>',
    search: (classList) => '<svg class="icon' + (classList ? ' ' + classList : '') + '" viewBox="0 0 512 512"><path d="M508.5 481.6l-129-129c-2.3-2.3-5.3-3.5-8.5-3.5h-10.3C395 312 416 262.5 416 208 416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c54.5 0 104-21 141.1-55.2V371c0 3.2 1.3 6.2 3.5 8.5l129 129c4.7 4.7 12.3 4.7 17 0l9.9-9.9c4.7-4.7 4.7-12.3 0-17zM208 384c-97.3 0-176-78.7-176-176S110.7 32 208 32s176 78.7 176 176-78.7 176-176 176z"/></svg>',
    circle: (classList) => '<svg class="icon' + (classList ? ' ' + classList : '') + '" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20"></svg>'
}

const urlParams = new URLSearchParams(window.location.search)

const IPFSConfig = {
    useLocal: () => urlParams.get("local") === "1",
    host: () => IPFSConfig.useLocal() ? "127.0.0.1" : (location.hostname === "ipfs.1-2.dev" ? location.hostname : "ipfs.infura.io"),
    port: () => IPFSConfig.useLocal() && urlParams.get("port") ? parseInt(urlParams.get("port")) : 5001,
    dlUrl: () => (location.hostname === "ipfs.1-2.dev" ? "ipfs.ipfs.1-2.dev" : "ipfs.infura-ipfs.io")
}

let progressSizes = {}
let cumulativeFilesize = 0

const initIPFSInstance = async () => {
    return IPFS.create({
        host: IPFSConfig.host(),
        port: IPFSConfig.port(),
        protocol: IPFSConfig.useLocal() ? "http" : "https"
    })
}

const readAsArrayBuffer = async (blob) => {
    return await new Promise((resolve) => {
        let fileReader = new FileReader()

        fileReader.onload = () => resolve(fileReader.result)
        fileReader.readAsArrayBuffer(blob)
    })
}

const addAll = async (ipfs, filesToUpload) => {
    const results = []

    for await (const result of ipfs.addAll(filesToUpload, {
        wrapWithDirectory: true,
        cidVersion: 1,
        progress: uploadProgress
    })) {
        results.push(result)
    }

    return results
}

const sizeOf = (bytes) => {
    if (bytes === 0) {
        return "0.00 B"
    }

    const e = Math.floor(Math.log(bytes) / Math.log(1024))

    return (bytes / Math.pow(1024, e)).toFixed(2) + " " + " KMGTP".charAt(e) + "B"
}

const copyUrl = async (event) => {
    const btn = event.currentTarget
    const tooltip = btn.getAttribute("data-tooltip")

    try {
        await navigator.clipboard.writeText(btn.getAttribute("data-copy"))
        btn.innerHTML = icons.check('fill-charcoal-muted--wcag7')
        btn.setAttribute("data-tooltip", "Copied!")
        btn.style.color = "green"
    } catch (err) {
        btn.innerHTML = icons.times('fill-charcoal-muted--wcag7')
        btn.setAttribute("data-tooltip", "Error!")
        btn.style.color = "red"
    }

    btn.classList.add('hover')

    setTimeout(() => {
        btn.classList.remove('hover')
        btn.innerHTML = icons.copy('fill-charcoal-muted--wcag7')
        btn.setAttribute("data-tooltip", tooltip)
        btn.style.color = "initial"
    }, 2000)
}

const uploadProgress = (bytes, path) => {
    progressSizes[path] = bytes

    const percentage = Math.round(((Object.values(progressSizes).reduce((a, b) => a + b)) / cumulativeFilesize) * 100)

    document.getElementById("progressBar").style.width = `${percentage}%`
}

const setUploadStatus = (content, isError, enableUploadBtn) => {
    DOM.upload().disabled = !enableUploadBtn

    if (isError) {
        DOM.uploadStatus().innerHTML = `<p class="error bg-red-muted white" role="status">An error occured: ${content}</p>`
    } else {
        DOM.uploadStatus().innerHTML = content
    }
}

initIPFSInstance().then(ipfs => {
    navigator.serviceWorker.register(
        new URL('../service-worker.js', import.meta.url),
        {type: 'module'}
    );

    DOM.accept().addEventListener("change", async (event) => {
        DOM.upload().value = ''
        event.currentTarget.closest("form").remove()
        DOM.main().removeAttribute("hidden")
        DOM.main().setAttribute("aria-hidden", "false")

        let isError = false

        if (!window.FileReader) {
            isError = true

            setUploadStatus(`The <a class="white" href="https://developer.mozilla.org/docs/Web/API/FileReader" target="_blank" rel="noopener noreferrer">FileReader API</a> is not supported by your browser.<br>Please upgrade your browser to the latest version and visit this page again.`, true, true)
        }

        DOM.spinner().innerHTML = icons.circle()

        // connection check
        try {
            await ipfs.version()
        } catch {
            isError = true

            setUploadStatus(`The IPFS node (${IPFSConfig.host()}:${IPFSConfig.port()}) is currently unreachable.<br>Please try again later (or ${IPFSConfig.useLocal() ? " <a class='white' href='?local=0'>switch to remote IPFS node</a>" : "<a class='white' href='?local=1'>switch to local IPFS node</a>"}).`, true, true)
        }

        DOM.spinner().remove()

        if (!isError) {
            DOM.upload().removeAttribute("hidden")
            DOM.upload().setAttribute("aria-hidden", "false")
            DOM.upload().setAttribute("tabindex", "0")

            // handle file selection, pasting and upload
            window.addEventListener("paste", (event) => {
                DOM.upload().files = event.clipboardData.files

                if ("createEvent" in document) {
                    var evt = document.createEvent("HTMLEvents")
                    evt.initEvent("change", false, true)
                    DOM.upload().dispatchEvent(evt)
                }
                else {
                    DOM.upload().fireEvent("onchange")
                }
            })

            DOM.upload().addEventListener("change", async (event) => {
                progressSizes = {}
                cumulativeFilesize = 0

                DOM.uploadStatus().innerHTML = ""

                const selectedFiles = event.currentTarget.files

                if (!selectedFiles.length) {
                    return
                }

                for (const blob of selectedFiles) {
                    cumulativeFilesize += blob.size
                }

                if (cumulativeFilesize < 1) {
                    return setUploadStatus(`An error occured: Invalid file${selectedFiles.length > 1 ? "s" : ""} provided`, true, true)
                }

                if (!IPFSConfig.useLocal() && cumulativeFilesize > 104857600) {
                    return setUploadStatus(`File${selectedFiles.length > 1 ? "s" : ""} too large (max. 100 MB per upload allowed)`, true, true)
                }

                setUploadStatus(`<h3 class="pt4 pt4-l ma0 f4 fw2 montserrat gray ttu flex-none no-select">Uploading file(s)</h3><p><div class="bg-light-gray h1 overflow-y-hidden mb4 w5"><div id="progressBar" class="bg-aqua h1 shadow-1 progress-bar" style="width:0"></div></div></p>`)

                if (selectedFiles.length > 0) {
                    const filesToUpload = []

                    for (const blob of selectedFiles) {
                        const arrayBuffer = await readAsArrayBuffer(blob)

                        filesToUpload.push({
                            path: blob.name,
                            content: arrayBuffer
                        })
                    }

                    addAll(ipfs, filesToUpload).then((results) => {
                        let pathCID = ''
                        const files = []

                        for (const result of results) {
                            if (!result.path.length) {
                                pathCID = result.cid.toString()
                            } else {
                                files.push({
                                    cid: result.cid.toString(),
                                    name: result.path,
                                    size: result.size
                                })
                            }
                        }

                        if (!DOM.downloadLinks().innerHTML.length) {
                            DOM.downloadLinks().innerHTML = `<h3 class="pt4 pt4-l ma0 f4 fw2 montserrat gray ttu flex-none no-select">Download(s)</h3>`
                        }

                        for (const file of files) {
                            const downloadURL = !IPFSConfig.useLocal() ? `https://${pathCID}.${IPFSConfig.dlUrl()}/${file.name}` : `ipfs://${pathCID}/${file.name}`

                            DOM.downloadLinks().querySelector("h3:first-child").insertAdjacentHTML("afterend",
                                `<dl class="fileInfo ba bg-near-white border-gray-muted lh-title pa3">` +
                                `<dt class="dib pr2 sans-serif charcoal-muted--wcag7 ttu f6 tracked">Filename</dt>` +
                                `<dd class="dib ma0 pa0 fw5 overflow-x-auto overflow-y-hidden w-100">${file.name}</dd>` +
                                `<dt class="dib pr2 sans-serif charcoal-muted--wcag7 ttu f6 tracked mt3">Filesize</dt>` +
                                `<dd class="dib ma0 pa0 fw5 overflow-x-auto overflow-y-hidden w-100">${sizeOf(file.size)}</dd>` +
                                `<dt class="dib pr2 sans-serif charcoal-muted--wcag7 ttu f6 tracked mt3">CIDv1 <span class="pointer items-center fw4 copy" data-copy="${file.cid}" data-tooltip="Copy CIDv1" data-tooltip-location="top">${icons.copy('fill-charcoal-muted')}</span> <a class="pointer no-underline" data-tooltip="Inspect CID" data-tooltip-location="top" href="https://cid.ipfs.io/#${file.cid}" target="_blank" rel="noopener noreferrer">${icons.search('fill-charcoal-muted')}</a></dt>` +
                                `<dd class="dib ma0 pa0 fw5 overflow-x-auto overflow-y-hidden w-100">${file.cid}</dd>` +
                                `<dt class="dib pr2 sans-serif charcoal-muted--wcag7 ttu f6 tracked mt3">Download <span class="pointer items-center fw4 copy" data-copy="${downloadURL}" data-tooltip="Copy Download URL" data-tooltip-location="top">${icons.copy('fill-charcoal-muted')}</span></dt>` +
                                `<dd class="dib ma0 pa0 fw5 overflow-x-auto overflow-y-hidden w-100"><a class="gray hover-black link--wcag7 underline" href="${downloadURL}" title="Download this file" target="_blank" rel="noopener noreferrer">${downloadURL}</a></dd>` +
                                `</dl>`
                            )
                        }

                        for (const btn of document.getElementsByClassName("copy")) {
                            btn.addEventListener("click", event => copyUrl(event))
                        }

                        setUploadStatus(null, false, true)
                    })
                }

                DOM.upload().value = ''
            })
        } else {
            DOM.upload().remove()
        }
    })
})
