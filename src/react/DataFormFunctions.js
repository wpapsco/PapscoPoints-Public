export default {
    onChange(name, value) {
        console.log('DataFormFunctions onChange');
        console.log(name);
        console.log(value);
        this.setState({
            [name]: value
        });
        console.log(this.state);
    },
    onSubmit() {
        console.log('DataFormFunctions onSubmit');
        console.log(this.state);
        this.props.onSubmit(this.state);
    },
    getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    },
    save(endpoint, data, callback) {
        if (!callback) {
            callback = (data) => { console.log(data); console.log('fetch is working') }
        }
        let host = document.location.hostname
        if (host == 'localhost') {
            host = host + ":3000"
        }
        fetch('http://' + host + '/save/' + endpoint, {
            credentials: "include",
            method: 'post',
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        }).then((data) => callback(data))
            .catch((error) => console.log(error));
    },
    get(endpoint, callback) {
        let host = document.location.hostname
        if (host == 'localhost') {
            host = host + ":3000"
        }
        console.log(host)
        fetch('http://' + host + '/get/' + endpoint, { credentials: "include" }).then(
            function (response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }
                response.json().then(function (data) {
                    console.log(data);
                    callback(data);
                });
            }
        ).catch(function (err) {
            console.log('Fetch Error :-S', err);
            console.log('feat');
        });
    }, ///tesat comment waow
    getP(endpoint) {
        let host = document.location.hostname
        if (host == 'localhost') {
            host = host + ":3000"
        }
        console.log(host)
        return fetch('http://' + host + '/get/' + endpoint, { credentials: "include" })
            .then((response) => response.json())
    }
}