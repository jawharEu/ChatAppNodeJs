const socket = io()


//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('#sendmsg')
const $messageFormButton = document.querySelector('#submitbtn')
const $locationbtn = document.querySelector('#send-location')
const $systemmsg = document.querySelector('#system-messages')
const $sidebar = document.querySelector('#chat-sidebar')

//Templates
const messageTemplate = document.querySelector('#msg-template').innerHTML
const locationTemplate = document.querySelector('#loc-template').innerHTML
const roomTemplate = document.querySelector('#room-template').innerHTML


//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    /// New message element
    const $newMessage = $systemmsg.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $systemmsg.offsetHeight

    // Height of messages container
    const containerHeight = $systemmsg.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $systemmsg.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $systemmsg.scrollTop = $systemmsg.scrollHeight
    }

}


socket.on('message', (msg) => {
    //console.log(msg);
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('HH:MM a')
    })
    $systemmsg.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
    //console.log('input changed ! ')
    e.preventDefault()

    //disable form
    $messageFormButton.setAttribute('disabled', 'disabled')


    //e.target.elements.sendmsg //we can access like that : e.target is the form
    socket.emit('sendmessage', $messageFormInput.value, (error) => {

        //enable form
        $messageFormButton.removeAttribute('disabled')

        //console.log('the message was delivered'+ msg );
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered !');
    })
})

socket.on('backmessage', (backmsg) => {
    //console.log(backmsg);
    //document.querySelector('#receivedmsg').value = backmsg
    $messageFormInput.value = ''
    $messageFormInput.focus()
    document.querySelector('#conversation').value = document.querySelector('#conversation').value + '\n' + moment(backmsg.createdAt).format('HH:MM a') + ' ' + backmsg.username + ' : ' + backmsg.text
})

$locationbtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Gealocation is not supported by your browser !')
    }

    $locationbtn.setAttribute('disabled', 'disabled')


    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared !');
            $locationbtn.removeAttribute('disabled')
        })
    })
})

socket.on('locationMessage', (location) => {
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('HH:MM a')
    })
    $systemmsg.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(roomTemplate, {
        roomname: room,
        users: users,
    })
    $sidebar.innerHTML = html
})