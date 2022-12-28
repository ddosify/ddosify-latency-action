const core = require('@actions/core');
const axios = require('axios');


function getConcatenatedLocations(obj) {
  const concatenatedKeysAndValues = {};

  function traverse(current, path) {
    for (const key in current) {
      const value = current[key];
      const newPath = path ? `${path}.${key.split(':')[0]}` : key.split(':')[0];

      if (Array.isArray(value)) {
        value.forEach((item) => {
          const [key, val] = item.split(':');
          concatenatedKeysAndValues[`${newPath}.${key}`] = val;
        });
      } else if (typeof value === 'object') {
        traverse(value, newPath);
      } else {
        const [key, val] = value.split(':');
        concatenatedKeysAndValues[`${newPath}.${key}`] = val;
      }
    }
  }

  traverse(obj);
  return concatenatedKeysAndValues;
}

// Run on every change: npm run prepare
async function run() {
  try {
    const responseLocations = await axios.get(
      'https://api.ddosify.com/v1/latency/locations/',
      {
        headers: {
          "X-API-KEY": core.getInput('api_key'),
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip,deflate,compress"
        }
      }
    );

    const locations = getConcatenatedLocations(responseLocations.data);

    const responseTest = await axios.post(
      'https://api.ddosify.com/v1/latency/test/',
      {
        "target": core.getInput('target'),
        "locations": JSON.parse(core.getInput('locations'))
      },
      {
        headers: {
          "X-API-KEY": core.getInput('api_key'),
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip,deflate,compress"
        }
      }
    );

    const failIfText = core.getInput('failIf').trim(); // any>100 or NA.US.MA.BO>80
    const failIfArr = failIfText.split(">")
    const failIfLocation = failIfArr[0].trim()
    const failIfLatency = failIfArr[1].trim()
    let failedLocations = []
    response = {}
    startIndex = 1
    if (failIfText !== "") {
      console.log(`Fail if: ${failIfText}`)
    }
    for (let locKey in responseTest.data) {
      response[startIndex++] = { ...{ "location": locations[locKey] }, ...{ "location_code": locKey }, ...responseTest.data[locKey] }
      latency = responseTest.data[locKey]["latency"];
      if (failIfText !== "" && ((failIfLocation === "any" && latency > failIfLatency) || (locKey === failIfLocation && latency > failIfLatency))) {
        failedLocations.push(`${latency},${locations[locKey]},${failIfLatency}`)
      }
    }
    for (let failedLocation in failedLocations) {
      const fLoc = failedLocation.split(",")
      core.error(`Latency (${fLoc[0]}) for ${fLoc[1]} is greater than ${fLoc[2]}.`);
    }
    if (failedLocations.length > 0) {
      core.setFailed("")
    }
    core.setOutput("result", response);
    console.table(response);

  } catch (error) {
    if (error.response && error.response.status === 401) {
      core.setFailed("api_key is not set. You can get is from https://app.ddosify.com");
    }
    else if (error.response && error.response.status === 403) {
      core.setFailed("api_key is not valid. You can get is from https://app.ddosify.com");
    }
    else {
      core.setFailed(error.message);
    }
  }
}

run();
