


// Linkedin has a ton (~30) <code> tags on the page with randomly changing ids
// one of them contains a versionTag key nested inside of a data attribute
// we need the value from this tag to include in remove connection requests
// so unfortunately we need to iterate through all of them to check tos ee if key is present

const parseVersionTag = (element) => { return JSON.parse(element.innerHTML).data.versionTag }
const containsVersionTag = (element) => {
  try {
    const versionTag = parseVersionTag(element);
    return typeof versionTag === "string"
  }
  catch(err) {
    return false
  }
}

const getVersionTag = () => {
  const codeElementWithVersionTag = Array.prototype.slice.call(document.querySelectorAll("code")).find(containsVersionTag)
  if(codeElementWithVersionTag) {
    return parseVersionTag(codeElementWithVersionTag)
  }
}

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

const raiseError = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText || response.status)
    error.response = response
    return Promise.reject(error)
  }
}

const parseJson = (response) => { return response.json(); }

// fetch a Url from linkedin using the pages credentials and csrf token
function doRequest(url, method="GET", body) {
  const headers = new Headers();
  headers.append("csrf-token", getCsrfToken());
  const options = {
    method: method,
    credentials: "include",
    headers: headers,
    body: body
  };
  return fetch(url, options)
    .then(raiseError)
    .then(parseJson)
    .then(json => {
      console.log(json)
      window.responseData = json;
      return json
    })
    .catch(err => {
      console.log(err);
    });
}

const parsePublicIdentifierFromConnectionResult = (sharedConnection) => sharedConnection.miniProfile.publicIdentifier

const getConnectionIdentifiers = (data) => data.elements.map(parsePublicIdentifierFromConnectionResult)

const removeConnection = (shortName) => {
  const body = '{"overflowActions":[],"actions":[]}';
  const versionTag = getVersionTag();
  const url = `https://www.linkedin.com/voyager/api/identity/profiles/${shortName}/profileActions?versionTag=${versionTag}&action=disconnect`
  return doRequest(url, "POST", body)
}
const debugRemoveConnection = (shortName) => {
  console.log("Removing: ", shortName);
  return Promise.resolve({shortname: shortName})
}


function getSharedConnections(shortName) {
  const url =  `https://www.linkedin.com/voyager/api/identity/profiles/${shortName}/memberConnections?q=inCommon&count=100`
  return doRequest(url, "GET")
          .then(getConnectionIdentifiers)
}


export function removeSharedConnections(shortName) {
 return getSharedConnections(shortName)
  .then((connectionShortNames) => {
    return Promise.all(connectionShortNames.map(removeConnection))
  })
}
