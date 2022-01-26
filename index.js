const express = require('express');
const request = require('xhr-request');
const redis = require('redis');

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT)

// make a request to Github for data
const getData = async (req, res) => {

    console.log('Fetching data .. ');

    const { username } = req.params;

    console.log(username)

    request(`https://api.github.com/users/${username}`, { method: 'GET', json: true },
        async (err, data) => {

            if (err) {
                res.status(500).send(err);
            }

            console.log(data);

            try {
                
                await client.set(username, JSON.stringify(data));

            } catch (e) {
                console.log(e)
            }

            res.send(data)
        }
    );

}

// cahe middleware
const cacheMiddleware = async (req, res, next) => {

    const { username } = req.params;

    client.get(username, (err, data) => {

        if (err) {
            res.status(500).send(err);
        }

        if (data) {
            console.log('Fetching from cache')
            res.send(data);
        } else {
            next();
        }
    });
}

const app = express()

app.get('/repos/:username',  cacheMiddleware, getData)

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})