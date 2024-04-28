// Define the Agora App ID
const APP_ID = "5052b8fe0cb6461f9cdca38692db9e9d"

// Get the user ID from session storage or generate a random one
let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}

let token = null;
let client;

let rtmClient;
let channel;

// Get the room ID from the URL query parameters or set it to 'main' if not provided
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    roomId = 'main'
}

// Get the display name from session storage or redirect to the lobby page if not set
let displayName = sessionStorage.getItem('display_name')
if(!displayName){
    window.location = 'lobby.html'
}

let localTracks = []
let remoteUsers = {}

let localScreenTracks;
let sharingScreen = false;

// Function to initialize the room joining process
let joinRoomInit = async () => {
    // Create an instance of the Agora RTM client and log in
    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid,token})

    // Add or update the local user's attributes with the display name
    await rtmClient.addOrUpdateLocalUserAttributes({'name':displayName})

    // Create a channel and join it
    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    // Set up event listeners for member joining, leaving, and channel messages
    channel.on('MemberJoined', handleMemberJoined)
    channel.on('MemberLeft', handleMemberLeft)
    channel.on('ChannelMessage', handleChannelMessage)

    // Get the list of members in the channel and display a welcome message
    getMembers()
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)

    // Create an instance of the Agora RTC client and join the room
    client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})
    await client.join(APP_ID, roomId, token, uid)

    // Set up event listeners for user publishing and leaving
    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserLeft)
}

// Function to join the stream and start publishing tracks
let joinStream = async () => {
    // Hide the join button and show the stream actions
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    // Create microphone and camera tracks with specific encoder configurations
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }})

    // Create a video container for the local user and add it to the streams container
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`

    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

    // Play the local camera track and publish the tracks to the room
    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0], localTracks[1]])
}

// Function to switch to camera track only
let switchToCamera = async () => {
    // Create a video container for the local user and add it to the display frame
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`
    displayFrame.insertAdjacentHTML('beforeend', player)

    // Mute the microphone and camera tracks
    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)

    // Remove active class from mic and screen buttons
    document.getElementById('mic-btn').classList.remove('active')
    document.getElementById('screen-btn').classList.remove('active')

    // Play the camera track and publish it to the room
    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])
}

// Function to handle user publishing
let handleUserPublished = async (user, mediaType) => {
    // Store the remote user in the remoteUsers object
    remoteUsers[user.uid] = user

    // Subscribe to the user's tracks
    await client.subscribe(user, mediaType)

    // Create a video container for the remote user if it doesn't exist
    let player = document.getElementById(`user-container-${user.uid}`)
    if(player === null){
        player = `<div class="video__container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}"></div>
            </div>`

        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)
   
    }

    // Resize the video frame if the display frame is active
    if(displayFrame.style.display){
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px'
        videoFrame.style.width = '100px'
    }

    // Play the video track if the media type is 'video'
    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`)
    }

    // Play the audio track if the media type is 'audio'
    if(mediaType === 'audio'){
        user.audioTrack.play()
    }
}

// Function to handle user leaving
let handleUserLeft = async (user) => {
    // Remove the remote user from the remoteUsers object
    delete remoteUsers[user.uid]

    // Remove the video container for the user
    let item = document.getElementById(`user-container-${user.uid}`)
    if(item){
        item.remove()
    }

    // Reset the display frame if the user in the display frame left
    if(userIdInDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null
        
        let videoFrames = document.getElementsByClassName('video__container')

        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
}

// Function to toggle the microphone track
let toggleMic = async (e) => {
    let button = e.currentTarget

    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}

// Function to toggle the camera track
let toggleCamera = async (e) => {
    let button = e.currentTarget

    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}

// Function to toggle the screen sharing
let toggleScreen = async (e) => {
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')

    if(!sharingScreen){
        sharingScreen = true

        // Activate the screen sharing button and deactivate the camera button
        screenButton.classList.add('active')
        cameraButton.classList.remove('active')
        cameraButton.style.display = 'none'

        // Create a screen video track and add it to the display frame
        localScreenTracks = await AgoraRTC.createScreenVideoTrack()

        document.getElementById(`user-container-${uid}`).remove()
        displayFrame.style.display = 'block'

        let player = `<div class="video__container" id="user-container-${uid}">
                <div class="video-player" id="user-${uid}"></div>
            </div>`

        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

        userIdInDisplayFrame = `user-container-${uid}`
        localScreenTracks.play(`user-${uid}`)

        // Unpublish the camera track and publish the screen track
        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTracks])

        // Resize the video frames in the streams container
        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; videoFrames.length > i; i++){
            if(videoFrames[i].id != userIdInDisplayFrame){
              videoFrames[i].style.height = '100px'
              videoFrames[i].style.width = '100px'
            }
          }
    }else{
        sharingScreen = false 
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()

        // Unpublish the screen track and switch back to the camera track
        await client.unpublish([localScreenTracks])
        switchToCamera()
    }
}

// Function to leave the stream
let leaveStream = async (e) => {
    e.preventDefault()

    // Show the join button and hide the stream actions
    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    // Stop and close the local tracks
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    // Unpublish the local tracks
    await client.unpublish([localTracks[0], localTracks[1]])

    // Unpublish the screen track if it exists
    if(localScreenTracks){
        await client.unpublish([localScreenTracks])
    }

    // Remove the video container for the local user
    document.getElementById(`user-container-${uid}`).remove()

    // Reset the display frame if the local user was in the display frame
    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null

        // Resize the video frames in the streams container
        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }

    // Send a channel message to notify other users about the user leaving
    channel.sendMessage({text:JSON.stringify({'type':'user_left', 'uid':uid})})
}

// Add event listeners to the buttons
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveStream)

// Call the joinRoomInit function to start the room joining process
joinRoomInit()