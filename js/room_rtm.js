// Function to handle when a member joins the room
let handleMemberJoined = async (MemberId) => {
    console.log('A new member has joined the room:', MemberId)
    addMemberToDom(MemberId) // Add the member to the DOM

    let members = await channel.getMembers() // Get the updated list of members
    updateMemberTotal(members) // Update the member count

    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name']) // Get the name of the member
    addBotMessageToDom(`Welcome to the room! ${name}!👋`) // Display a welcome message from the bot
}

// Function to add a member to the DOM
let addMemberToDom = async (MemberId) => {
    let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name']) // Get the name of the member

    let membersWrapper = document.getElementById('member__list') // Get the wrapper element for members
    let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name}</p>
                    </div>` // Create the HTML for the member item

    membersWrapper.insertAdjacentHTML('beforeend', memberItem) // Add the member item to the DOM
}

// Function to update the member count
let updateMemberTotal = async (members) => {
    let total = document.getElementById('members__count') // Get the element for the member count
    total.innerText = members.length // Update the member count
}

// Function to handle when a member leaves the room
let handleMemberLeft = async (MemberId) => {
    removeMemberFromDom(MemberId) // Remove the member from the DOM

    let members = await channel.getMembers() // Get the updated list of members
    updateMemberTotal(members) // Update the member count
}

// Function to remove a member from the DOM
let removeMemberFromDom = async (MemberId) => {
    let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`) // Get the wrapper element for the member
    let name = memberWrapper.getElementsByClassName('member_name')[0].textContent // Get the name of the member
    addBotMessageToDom(`${name} has left the room.`) // Display a message from the bot

    memberWrapper.remove() // Remove the member from the DOM
}

// Function to get the list of members
let getMembers = async () => {
    let members = await channel.getMembers() // Get the list of members
    updateMemberTotal(members) // Update the member count
    for (let i = 0; members.length > i; i++){
        addMemberToDom(members[i]) // Add each member to the DOM
    }
}

// Function to handle channel messages
let handleChannelMessage = async (messageData, MemberId) => {
    console.log('A new message was received')
    let data = JSON.parse(messageData.text) // Parse the message data

    if(data.type === 'chat'){
        addMessageToDom(data.displayName, data.message) // Add the chat message to the DOM
    }

    if(data.type === 'user_left'){
        document.getElementById(`user-container-${data.uid}`).remove() // Remove the user container

        if(userIdInDisplayFrame === `user-container-${uid}`){
            displayFrame.style.display = null // Reset the display frame
    
            for(let i = 0; videoFrames.length > i; i++){
                videoFrames[i].style.height = '300px' // Reset the height of video frames
                videoFrames[i].style.width = '300px' // Reset the width of video frames
            }
        }
    }
}

// Function to send a message
let sendMessage = async (e) => {
    e.preventDefault()

    let message = e.target.message.value // Get the message from the form
    channel.sendMessage({text:JSON.stringify({'type':'chat', 'message':message, 'displayName':displayName})}) // Send the message to the channel
    addMessageToDom(displayName, message) // Add the message to the DOM
    e.target.reset() // Reset the form
}

// Function to add a message to the DOM
let addMessageToDom = (name, message) => {
    let messagesWrapper = document.getElementById('messages') // Get the wrapper element for messages

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>` // Create the HTML for the message

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage) // Add the message to the DOM

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child') // Get the last message
    if(lastMessage){
        lastMessage.scrollIntoView() // Scroll to the last message
    }
}

// Function to add a bot message to the DOM
let addBotMessageToDom = (botMessage) => {
    let messagesWrapper = document.getElementById('messages') // Get the wrapper element for messages

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 IceBreakerBot</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                    </div>` // Create the HTML for the bot message

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage) // Add the bot message to the DOM

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child') // Get the last message
    if(lastMessage){
        lastMessage.scrollIntoView() // Scroll to the last message
    }
}

// Function to leave the channel
let leaveChannel = async () => {
    await channel.leave() // Leave the channel
    await rtmClient.logout() // Logout from the RTM client
}

window.addEventListener('beforeunload', leaveChannel) // Add event listener to leave the channel before unloading the window
let messageForm = document.getElementById('message__form') // Get the message form
messageForm.addEventListener('submit', sendMessage) // Add event listener to send a message when the form is submitted