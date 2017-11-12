import { removeSharedConnections } from "./api";
import arrive from "arrive"


// Converts a linkedin profile page url or path into a linkedin shortname that can be used to query the api
// Example: profileUrlToShortName("https://www.linkedin.com/in/kristinatfoundhuman/") => "kristinatfoundhuman"
let profileUrlToShortName = url => url.split("/in/")[1].split("/")[0];
const hasSharedConnections = (element) => element.querySelector(".mn-person-info__shared-insights-count")

// Create a 'remove all connections' button and add an event listener to it
let createRemoveAllSharedConnectionsButton = shortName => {
  let button = document.createElement("button");
  button.setAttribute("title", "Remove all shared connections");
  button.setAttribute(
    "class",
    "mn-person-info__shared-insights-btn  Sans-13px-black-55%"
  );
  button.setAttribute("shortname", shortName);

  button.innerHTML = "<span>Flush</span>";

  button.addEventListener("click", onFlushConnections, false);

  return button;
};

let deleteAllConnections = shortName => {
  if (
    window.confirm(
      `Do you really want to remove all mutual connections with ${shortName}?`
    )
  ) {
    removeSharedConnections(shortName).then(() =>
      alert("connections removed successfully")
    );
  }
};

// event handler for clicks on remove all shared connections button
let onFlushConnections = event => {
  const shortName = event.currentTarget.getAttribute("shortname");
  if (shortName) {
    deleteAllConnections(shortName);
  } else {
    console.error("No shortname found on ", event.currentTarget);
  }
};

// Add a remove all connections button the person display
function addRemoveAllButton(element, linkSelector, buttonLocation) {
  const shortName = profileUrlToShortName(element.querySelector('a[href^="/in/"]').href)
  const flushButton = createRemoveAllSharedConnectionsButton(shortName);
  element.querySelector(buttonLocation).append(flushButton);
}

const addListenerToSelector = (personSelectors) => {
  document.arrive(".mn-person-info__shared-insights", function() {
      const summaryElement = this.closest(".ember-view")
      addRemoveAllButton(summaryElement, ".mn-person-info__link", ".mn-person-info__shared-insights")
  })
}

addListenerToSelector()
