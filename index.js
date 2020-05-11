var lastRightClickedItem = null; // Used to store which bar item was right clicked.

/**  ADD BOOKMARK DIALOG FUNCTIONS **/

function clearAddBookmarkInputFields() {
  document.getElementById("add-bookmark-name").value = "";
  document.getElementById("add-bookmark-location").value = "";
}

// Closes and clears the add bookmark dialog window
function closeAddBookmarkDialog() {
  document.getElementById("add-bookmark-dialog").style.display = "none";
  clearAddBookmarkInputFields();
}

// Handles opening off the add bookmark dialog
function openAddBookmarkDialog() {
  var dialog = document.getElementById("add-bookmark-dialog");
  // Close other dialogs
  closeEditBookmarkDialog();

  dialog.style.display = "block";
  dialog.style.left = event.x + "px";
  dialog.style.top = event.y + "px";
}

// Generates a new ID for items in the bar
function generateItemUniqueID() {
  var newID = 0;
  var bookmarks = JSON.parse(window.localStorage.getItem("bookmarks"));
  bookmarks.forEach((bookmark, index) => {
    if (Number(bookmark.id) >= newID) newID = Number(bookmark.id) + 1;
  });

  return newID;
}

// Adds a bookmark to the local storage and to the DOM
function addBookmark() {
  var name = document.getElementById("add-bookmark-name").value;
  var location = document.getElementById("add-bookmark-location").value;
  var bookmarks = JSON.parse(window.localStorage.getItem("bookmarks"));
  var newID = generateItemUniqueID();

  // Add to existing bookmarks in storage
  bookmarks.push({
    location: location,
    name: name,
    id: newID,
  });

  // Store it
  window.localStorage.setItem("bookmarks", JSON.stringify(bookmarks));

  // Create new li html item
  createBookmarkItem(name, location, newID);
  closeAddBookmarkDialog();
}

/** EDIT BOOKMARK DIALOG FUNCTIONS **/

// Handles closing off the edit bookmark dialog. Don't need to worry about clearing input fields
// The dialog always opens with the values off the clicked bookmark
function closeEditBookmarkDialog() {
  var dialog = document.getElementById("edit-bookmark-dialog");
  dialog.style.display = "none";
}

// Handles opening the editbookmark dialog
function openEditBookmarkDialog() {
  var dialog = document.getElementById("edit-bookmark-dialog");
  var bookmarks = JSON.parse(window.localStorage.getItem("bookmarks"));
  // Close other dialogs
  closeAddBookmarkDialog();

  // Find which bookmark was clicked
  var bookmark = bookmarks.find(
    (bookmark) => bookmark.id == lastRightClickedItem
  );

  // set the input fields equal to the bookmark
  document.getElementById("edit-bookmark-name").value = bookmark.name;
  document.getElementById("edit-bookmark-location").value = bookmark.location;

  // Show dialog
  dialog.style.display = "block";
  dialog.style.left = event.x + "px";
  dialog.style.top = event.y + "px";
}

// Handles overwriting a bookmark from the edit dialog
function saveBookmark() {
  var newName = document.getElementById("edit-bookmark-name").value;
  // prettier-ignore
  var newLocation = document.getElementById("edit-bookmark-location").value;

  var bookmarks = JSON.parse(window.localStorage.getItem("bookmarks"));
  // Find and update the saved bookmark
  bookmarks.forEach((bookmark, index) => {
    if (bookmark.id == lastRightClickedItem) {
      bookmark.location = newLocation;
      bookmark.name = newName;
    }
  });

  // Find the bookmark in the DOM
  var item = document.getElementById(lastRightClickedItem);
  var itemIcon = item.querySelector(".item-icon");
  var itemText = item.querySelector(".item-text");

  // Updates titles
  item.title = newLocation;
  itemIcon.title = newLocation;
  itemText.title = newLocation;

  // update icon src
  itemIcon.src = getIconSrc(newLocation);

  // Update on click handler to point at new location
  item.onclick = () => {
    window.open(checkHttps(newLocation));
  };
  // Update text with either the name or the location
  itemText.textContent = newName.length ? newName : newLocation;

  window.localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  closeEditBookmarkDialog();
}

// Remove a bookmark from localstorage and the dom
function removeBookmark() {
  var bookmarks = JSON.parse(window.localStorage.getItem("bookmarks"));
  // Remove from local storage
  bookmarks.forEach((bookmark, index) => {
    if (bookmark.id == lastRightClickedItem) {
      bookmarks.splice(index, 1);
    }
  });

  window.localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  // "Delete" the item
  document.getElementById(lastRightClickedItem).outerHTML = "";
}

/** HELPERS **/

// function just gets the favicon
function getIconSrc(location) {
  return "https://www.google.com/s2/favicons?domain=" + location;
}

// Only used to make sure when clicking a bookmark it opens a valid url in a new tab
function checkHttps(location) {
  if (location.match(/^(?!https?).*$/)) {
    return (location = "https://" + location);
  }
  return location;
}

function closeContextMenus() {
  closeBarContextMenu();
  closeBookmarkContextMenu();
}

function closeBarContextMenu() {
  document.getElementById("bar-context-menu").style.display = "none";
}

function closeBookmarkContextMenu() {
  document.getElementById("bookmark-context-menu").style.display = "none";
}

// Generate and adds a bookmark to the bar in the DOM
function createBookmarkItem(name, location, id) {
  var bar = document.getElementById("bar");
  var li = document.createElement("li");

  li.className = "item";
  li.id = id;
  li.title = location;
  li.draggable = "true";

  // Add a context menu here, seems nicer
  li.oncontextmenu = (ev) => {
    ev.preventDefault();
    // Check if the right click target was either item-text / item-icon.
    // prettier-ignore
    if (ev.target.className === "item-icon" || ev.target.className === "item-text") {
      lastRightClickedItem = ev.target.parentNode.id;
    } else {
      lastRightClickedItem = ev.target.id;
    }

    var bookmarkContextMenu = this.document.getElementById(
      "bookmark-context-menu"
    );

    bookmarkContextMenu.style.display = "block";
    bookmarkContextMenu.style.left = ev.x + "px";
    bookmarkContextMenu.style.top = ev.y + "px";
    return false;
  };

  // Opens the bookmark in new tab, tries to add https to a url such as "reddit.com" so it opens nicely
  li.onclick = (ev) => {
    window.open(checkHttps(location));
  };

  // Track which element was dragged
  li.ondragstart = (ev) => {
    ev.dataTransfer.setData("text/plain", ev.target.id);
  };

  // This somehow stopped ondrop firing
  li.ondragover = (ev) => {
    ev.preventDefault();
  };

  // Handles dropping an list item on another
  li.ondrop = (ev) => {
    ev.preventDefault();

    var bookmarks = JSON.parse(window.localStorage.getItem("bookmarks"));
    var draggedElementID = ev.dataTransfer.getData("text");
    var draggedElement = document.getElementById(draggedElementID);

    var targetElement = ev.target;
    var targetElementID = targetElement.id;

    var bar = document.getElementById("bar");

    // Find the ID if drop was on either the icon or text elements of the li item
    // prettier-ignore
    if (targetElementID == "") {
      targetElementID = ev.target.parentNode.id;
      // Want to swap the whole bookmark if dropped on the text or icon
      targetElement = ev.target.parentNode;
    }

    // Swap the two bookmarks in local storage for persistance
    var targetBookmarkIndex = 0;
    var draggedBookmarkIndex = 0;
    bookmarks.forEach((bookmark, index) => {
      if (bookmark.id == targetElementID) targetBookmarkIndex = index;
      if (bookmark.id == draggedElementID) draggedBookmarkIndex = index;
    });

    var swap = bookmarks[targetBookmarkIndex];
    bookmarks[targetBookmarkIndex] = bookmarks[draggedBookmarkIndex];
    bookmarks[draggedBookmarkIndex] = swap;
    window.localStorage.setItem("bookmarks", JSON.stringify(bookmarks));

    // Actually swap the elements
    if (targetBookmarkIndex > draggedBookmarkIndex)
      bar.insertBefore(targetElement, draggedElement);
    else bar.insertBefore(draggedElement, targetElement);
  };

  // Give the item it's icon
  var icon = document.createElement("img");
  icon.src = getIconSrc(location);
  icon.className = "item-icon";
  icon.title = location;

  // Give the text
  var text = document.createElement("span");
  text.className = "item-text";
  text.textContent = name.length ? name : location;
  text.title = location;

  li.appendChild(icon);
  li.appendChild(text);
  bar.appendChild(li);
}

window.onload = () => {
  // Check if there is any bookmarks already.. if not create a few fake ones.
  // Just so you guys can see something
  if (window.localStorage.getItem("bookmarks") === null) {
    window.localStorage.setItem(
      "bookmarks",
      JSON.stringify([
        {
          location: "https://www.mozilla.org/en-GB/firefox/central/",
          name: "Getting Started",
          id: 1,
        },
        {
          location: "https://www.seidat.com/",
          name: "Seidat",
          id: 2,
        },
        {
          location: "https://github.com/ashksmith",
          name: "My Github",
          id: 3,
        },
        {
          location: "https://www.linkedin.com/in/ashleyksmith/",
          name: "My LinkedIn",
          id: 4,
        },
      ])
    );
  }

  // Get existing bookmarks from local storage
  const bookmarks = JSON.parse(window.localStorage.getItem("bookmarks"));
  // List them out
  if (bookmarks.length) {
    bookmarks.forEach((bookmark) => {
      createBookmarkItem(bookmark.name, bookmark.location, bookmark.id);
    });
  }

  // Add listener for right click on bar
  document.getElementById("bar").oncontextmenu = (ev) => {
    ev.preventDefault();

    var menu = document.getElementById("bar-context-menu");
    menu.style.display = "block";
    menu.style.left = ev.x + "px";
    menu.style.top = ev.y + "px";
  };

  // Close the context menu when clicking
  document.addEventListener("click", (ev) => {
    closeContextMenus();
  });
};
