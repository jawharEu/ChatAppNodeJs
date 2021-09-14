const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date() //.toLocaleTimeString()
    }
}

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}