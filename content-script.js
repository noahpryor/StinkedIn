
// Linkedin's CSRF tokens are stored in a cookie named JSESSIONID
// Since the cookie api is terrible/nonexistent, this is a janky way to parse it
// Example: getCsrfToken() => ajax:1234567
const getCsrfToken = () => {
  const CSRF_COOKIE_NAME = "JSESSIONID";
  if(document.cookie.includes(CSRF_COOKIE_NAME)) {
    return document.cookie.split(`${CSRF_COOKIE_NAME}="`)[1].split('";')[0]
  }
  else {
    throw new Error("Oh no we couldn't find the csrf token, you're stuck with shitty linkedin")
  }
}

const parseJson = (response) => response.json();

// fetch a Url from linkedin using the pages credentials and csrf token
function doRequest(url, method="GET", body) {
  const headers = new Headers();
  headers.append("csrf-token", getCsrfToken());
  return fetch(url, {
    method: method,
    credentials: "include",
    headers: headers,
    body: body
  })
    .then(parseJson)
    .then(json => {

      window.responseData = json;
      return json
    })
    .then((data) => parseRelationshipUrns(data.elements))
    .then(json => {
      console.log("urns", json);
      window.urns = json;
      return json
    })
    .catch(err => {
      console.log(err);
    });
}

const getSharedConnections = (shortName) => {
  const url =  `https://www.linkedin.com/voyager/api/identity/profiles/${shortName}/memberConnections?q=inCommon&count=100`
  return doRequest(url, "GET")
}

const deleteConnection = (urn) => {
  const url = `https://www.linkedin.com/voyager/api/relationships/connections/${urn}`
  return doRequest(url, "DELETE")
}
//  Get the id of a linkeding relationshop (entity urn) from a searchResult
const parseRelationUrnFromConnectionResult = (sharedConnection) => sharedConnection.miniProfile.entityUrn.replace("urn:li:fs_miniProfile:","")

const parseRelationshipUrns = (elements) => elements.map(parseRelationUrnFromConnectionResult)

const selectors = {
  // selectors for requests to connect
  invitations: {
    container: ".mn-invitation-card__invite-details-container",
    details: ".mn-person-info__picture",
    buttonContainer: ".mn-person-card__card-actions"
  },
  // selectors for people you may know
  peopleYouMayKnow: {
    container: ".mn-pymk-list__card",
    details: ".mn-person-info__link",
    buttonContainer: ".mn-person-info__card-details"
  }
};


// Converts a linkedin profile page url or path into a linkedin shortname that can be used to query the api
// Example: profileUrlToShortName("https://www.linkedin.com/in/kristinatfoundhuman/") => "kristinatfoundhuman"
let profileUrlToShortName = (url) => url.split("/in/")[1].split("/")[0]

// Create a 'remove all connections' button and add an event listener to it
let createRemoveAllSharedConnectionsButton = shortName => {
  let button = document.createElement("button");
  button.innerHTML = "<span>Nuke</span>";
  button.title = "Remove all shared connections";
  button.className = "mn-person-card__person-btn-ext button-tertiary-medium-muted";
  button.setAttribute("shortname", shortName);

  button.addEventListener("click", handleRemoveAllButtonClick, false);

  return button;
};

let deleteAllConnections = (relationShipIds) => {
  if (window.confirm(`Do you really want to remove ${relationShipIds.length} connections?`)) {
    relationShipIds.map((connectionId) => {
      console.info("deleting " + connectionId)
      deleteConnection(connectionId).then(()=> console.log("Completed!"))
    })
  }
}

// event handler for clicks on remove all shared connections button
let handleRemoveAllButtonClick = (event) => {
  const shortName = event.currentTarget.getAttribute("shortname");
  if(shortName) {
    getSharedConnections(shortName).then(deleteAllConnections)
  }
  else {
    console.error("No shortname found on ", event.currentTarget)
  }
}

// Add a remove all connections button the person display
function addRemoveAllButton(element, linkSelector, buttonLocation) {
  const profileUrl = element.querySelector(linkSelector).href;
  const shortName = profileUrlToShortName(profileUrl)
  const removeAllButton = createRemoveAllSharedConnectionsButton(shortName);
  element.querySelector(buttonLocation).append(removeAllButton)
}


// Add remove all connections buttons to all people in a section
function addRemoveAllButtons(type) {
  // check to see if we have a place to add button, if not wait 1 second and try again

  const personSelectors = selectors[type];
  if (!document.querySelector(personSelectors.buttonContainer)) {
    console.warn(
      `${personSelectors.buttonContainer} doesn't yet exit on page, trying again in 1 second`
    );
    setTimeout(() => addRemoveAllButtons(type), 1000);
  }
  document.querySelectorAll(personSelectors.container).forEach(element => {
    addRemoveAllButton(
      element,
      personSelectors.details,
      personSelectors.buttonContainer
    );
  });
}

setTimeout(() => addRemoveAllButtons("peopleYouMayKnow"), 5000);
setTimeout(() => addRemoveAllButtons("invitations")), 5000;
