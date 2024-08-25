const LC_REQUEST_URL = "https://leetcode.com/graphql/";
// TODO:
//  - increment / decrement if dislike is clicked / unclicked.
//  - code to get dislikes runs twice when URL changes (once onLoad, once for change).
//  - remove jQuery dependency
//  - ensure multiple mutation observers are not being created
//  - round dislikes in the thousands (like likes are)

/**
 * Get dislikes for an LC question given its official name.
 * @param questionTitleSlug {String} Official LC question name
 * @return {Promise} Number of dislikes for questionTitleSlug.
 */
function getLCDislikes(questionTitleSlug) {
    return fetch(LC_REQUEST_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Add any additional headers if required
        },
        body: JSON.stringify({
            query: `
              query questionTitle($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                  questionId
                  questionFrontendId
                  title
                  titleSlug
                  isPaidOnly
                  difficulty
                  likes
                  dislikes
                  categoryTitle
                }
              }
            `,
            variables: {titleSlug: questionTitleSlug},
            operationName: "questionTitle"
        })
    })
        .then(response => response.json())
        .catch(error => {
            console.error(`Error querying ${questionTitleSlug}:`, error);
            return {};
        });
}

function getLCTitleSlug() {
    const errorMsgPre = "Error obtaining question title:";
    const parts = window.location.pathname.split("/");

    if (parts.length !== 5 || parts[0] !== "" || parts[4] !== "") {
        console.log(`${errorMsgPre} Pathname length error.`)
        return "";
    }

    if (parts[1] !== "problems") {
        console.log(`${errorMsgPre} First part of pathname is not \"problems\".`);
        return "";
    }

    if (parts[3] !== "description") {
        console.log(`${errorMsgPre} Third part of pathname is not \"description\".`);
        return "";
    }

    return parts[2];
}

function addDislikesCountToPage(numDislikes) {
    const errorMsgPre = "Error adding dislikes count to webpage:";
    const divElementId = "dislikesCounterChromeExt19384747"

    // Make sure dislike counter is not already added
    if(document.getElementById(divElementId)) {
        console.log("Dislike count already detected, not adding again.")
        return;
    }

    // Find the SVG element using the data-icon attribute
    const svgElement = getThumbsDownButton();

    if(!svgElement) {
        console.log(`${errorMsgPre} Could not locate thumbs down icon.`);
        return;
    }

    // Get the parent div of the SVG element
    const parentDiv = svgElement.parentElement;

    if(!parentDiv) {
        console.log(`${errorMsgPre} Could not locate parent div of thumbs down icon.`);
        return;
    }

    // Create a new div element
    const newDiv = document.createElement("div");
    newDiv.setAttribute("id", divElementId);

    // Set the text content of the new div to the integer value
    newDiv.textContent = numDislikes;

    // Insert the new div after the parent div
    parentDiv.insertAdjacentElement("afterend", newDiv);

    console.log("Added dislikes to webpage");
}

function getThumbsDownButton() {
    return document.querySelector('svg[data-icon="thumbs-down"]');
}

function fetchAndRenderLCDislikesOnWebpage() {
    const questionTitleSlug = getLCTitleSlug();
    if (questionTitleSlug !== "") {
        getLCDislikes(questionTitleSlug).then(res => {
            const dislikes = res.data.question.dislikes;
            addDislikesCountToPage(dislikes);
        })
    }
}

function main() {
    if(getThumbsDownButton()) {
        fetchAndRenderLCDislikesOnWebpage();
    } else {
        // Start observing the document for changes
        const thumbsDownBtnObserver = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Try to find the SVG again after any child list mutation
                    const svgElement = getThumbsDownButton();
                    if (svgElement) {
                        fetchAndRenderLCDislikesOnWebpage();
                        observer.disconnect(); // Stop observing once the element is found
                        break;
                    }
                }
            }
        });

        // Observe the entire document, or you can scope it to a specific container
        thumbsDownBtnObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        onUrlChange();
    }
}).observe(document, {subtree: true, childList: true});

function onUrlChange() {
    console.log('URL changed!', location.href);
    main();
}

window.addEventListener('load', function() {
    main();
});