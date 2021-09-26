module.exports = {
    removeComments: (comments) => {
        return !comments.startsWith("<!--#")
    },
}
