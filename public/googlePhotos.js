class GooglePhotos {
    constructor(props) {
        if(props && props.gapi){
            this.gapi = props.gapi;
        };
        // Client ID and API key from the Developer Console
        this.CLIENT_ID = '834549732986-99d0228aijf0ejf6fslusptp0e101gh4.apps.googleusercontent.com';
        this.API_KEY = 'AIzaSyBZ4-cdtlLhdtZ6SWBvAQY70DAfP4jhfLc';

        // Authorization scopes required by the API; multiple scopes can be
        // included, separated by spaces.
        this.SCOPES = "https://www.googleapis.com/auth/photoslibrary.readonly";

        this.authorizeButton = document.getElementById('authorize_button');
        this.signoutButton = document.getElementById('signout_button');
        this.initClient = this.initClient.bind(this);
        this.updateSigninStatus = this.updateSigninStatus.bind(this);
        this.getYears = this.getYears.bind(this);
        this.handleSignoutClick = this.handleSignoutClick.bind(this);
        this.handleAuthClick = this.handleAuthClick.bind(this);

    }

    handleClientLoad(gapi) {
        /**
         *  On load, called to load the auth2 library and API client library.
         */
        this.gapi = gapi;
        gapi.load('client:auth2', this.initClient);
    }

    initClient() {
        /**
         *  Initializes the API client library and sets up sign-in state
         *  listeners.
         */
        this.gapi.client.init({
            apiKey: this.API_KEY,
            clientId: this.CLIENT_ID,
            // discoveryDocs: this.DISCOVERY_DOCS,
            scope: this.SCOPES
        }).then(() => {
            // Listen for sign-in state changes.
            this.gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);

            // Handle the initial sign-in state.
            this.updateSigninStatus(this.gapi.auth2.getAuthInstance().isSignedIn.get());
            this.authorizeButton.onclick = this.handleAuthClick;
            this.signoutButton.onclick = this.handleSignoutClick;
        });
    }

    updateSigninStatus(isSignedIn) {
        /**
         *  Called when the signed in status changes, to update the UI
         *  appropriately. After a sign-in, the API is called.
         */
        if (isSignedIn) {
            this.authorizeButton.style.display = 'none';
            this.signoutButton.style.display = 'block';
            this.getYears();
        } else {
            this.authorizeButton.style.display = 'block';
            this.signoutButton.style.display = 'none';
        }
    }

    handleAuthClick(event) {
        /**
         *  Sign in the user upon button click.
         */
        this.gapi.auth2.getAuthInstance().signIn();
    }

    handleSignoutClick(event) {
        /**
         *  Sign out the user upon button click.
         */
        this.gapi.auth2.getAuthInstance().signOut();
    }

    getYears() {
        const currentMonth = new Date().getMonth() + 1;
        const currentDay = new Date().getDate();
        for(let currentYear = new Date().getFullYear(); currentYear > 2006; currentYear-- ) {
            let d = document.createElement('div');
            d.classList.add(`year-${currentYear}`);
            document.body.appendChild(d);
            let h2 = document.createElement('h2');
            h2.innerText = currentYear;
            d.appendChild(h2);
            this.getImages(currentDay, currentMonth, currentYear);
        }
    }

    getImages(currentDay, currentMonth, currentYear, pageToken) {
        const body = {
            "filters": {
                "dateFilter": {
                    "dates": [
                        {
                            "day": currentDay,
                            "month": currentMonth,
                            "year": currentYear
                        }
                    ]
                }
            }
        };
        if(pageToken){
            body.pageToken = pageToken;
        }
        fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
            method: 'POST',
            headers: {
                authorization: `Bearer ${gapi.client.getToken().access_token}`
            },
            body: JSON.stringify(body),
        }).then((response) => {
            if(response.ok){
                return response.json();
            }
        }).then((response) => {
            if(response.nextPageToken){
                this.getImages(currentDay, currentMonth, currentYear, response.nextPageToken)
            }
            if (response.mediaItems) {
                response.mediaItems.forEach((item) => {
                    const itemYear = item.mediaMetadata.creationTime.split('-')[0];
                    let yearDiv = document.querySelector(`.year-${itemYear}`);
                    const iThumb = document.createElement('img');
                    iThumb.src = `${item.baseUrl}=w128-h128-c`;
                    iThumb.classList.add('img-thumbnail');
                    const iFull = document.createElement('img');
                    iFull.src = `${item.baseUrl}=w${item.mediaMetadata.width}-h${item.mediaMetadata.height}`;
                    iFull.classList.add('img-full-size');
                    yearDiv.appendChild(iThumb);
                    yearDiv.appendChild(iFull);
                });
            }
        });
    }
}
