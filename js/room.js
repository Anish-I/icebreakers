// Get the element with the id 'messages'
let messagesContainer = document.getElementById('messages');

// Scroll to the bottom of the messages container
messagesContainer.scrollTop = messagesContainer.scrollHeight;

// Get the elements with the ids 'members__container' and 'members__button'
const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

// Get the elements with the ids 'messages__container' and 'chat__button'
const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

// Initialize variables to track the state of the member container and chat container
let activeMemberContainer = false;
let activeChatContainer = false;

// Add a click event listener to the member button
memberButton.addEventListener('click', () => {
  // Toggle the display of the member container based on its current state
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  // Update the state of the member container
  activeMemberContainer = !activeMemberContainer;
});

// Add a click event listener to the chat button
chatButton.addEventListener('click', () => {
  // Toggle the display of the chat container based on its current state
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  // Update the state of the chat container
  activeChatContainer = !activeChatContainer;
});

// Get the element with the id 'stream__box'
let displayFrame = document.getElementById('stream__box');

// Get all elements with the class 'video__container'
let videoFrames = document.getElementsByClassName('video__container');

// Initialize a variable to store the user ID in the display frame
let userIdInDisplayFrame = null;

// Function to expand the video frame when clicked
let expandVideoFrame = (e) => {
  // Move the current child element of the display frame to the streams container
  let child = displayFrame.children[0];
  if (child) {
    document.getElementById('streams__container').appendChild(child);
  }

  // Set the display style of the display frame to 'block' and append the clicked element to it
  displayFrame.style.display = 'block';
  displayFrame.appendChild(e.currentTarget);

  // Update the user ID in the display frame
  userIdInDisplayFrame = e.currentTarget.id;

  // Adjust the size of the other video frames
  for (let i = 0; i < videoFrames.length; i++) {
    if (videoFrames[i].id != userIdInDisplayFrame) {
      videoFrames[i].style.height = '100px';
      videoFrames[i].style.width = '100px';
    }
  }
}

// Add click event listeners to all video frames
for (let i = 0; i < videoFrames.length; i++) {
  videoFrames[i].addEventListener('click', expandVideoFrame);
}

// Function to hide the display frame
let hideDisplayFrame = () => {
  // Reset the user ID in the display frame and hide it
  userIdInDisplayFrame = null;
  displayFrame.style.display = null;

  // Move the child element of the display frame back to the streams container
  let child = displayFrame.children[0];
  document.getElementById('streams__container').appendChild(child);

  // Restore the size of the video frames
  for (let i = 0; i < videoFrames.length; i++) {
    videoFrames[i].style.height = '300px';
    videoFrames[i].style.width = '300px';
  }
}

// Add a click event listener to the display frame
displayFrame.addEventListener('click', hideDisplayFrame);