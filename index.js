import express from "express"
import cors from 'cors'
import axios from 'axios'
import { createClient } from 'redis'

const DEFAULT_EXPIRATION = 3600
const redisClient = createClient()

const app = express()
app.use(cors())

app.get("/photos", async (req, res) => {

    const albumId = req.query.albumId

    const photos = await redisClient.get(`photos?albumId=${albumId}`)

    if (photos != null) {

        return res.json(JSON.parse(photos))

    }

    const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos",
        { params: { albumId } }
    )
    redisClient.setEx(`photos?albumId=${albumId}`, DEFAULT_EXPIRATION, JSON.stringify(data))
    return res.json(data)

})

app.get("/photos/:id", async (req, res) => {
    // const { data } = await axios.get(
    //     `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    // )
    // res.json(data)

    const photo = await get_or_set_cache(`photos:${req.params.id}`, async () => {
        const { data } = await axios.get(
            `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
        )
        return data
    })

    res.json(photo)

})

function get_or_set_cache(key, cb){
    return new Promise( async (resolve, reject) => {
        try {

            const data = await redisClient.get(key)

            if (data != null)
                return resolve(JSON.parse(data))

            const fresh_data = await cb()

            redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(fresh_data))
            resolve(fresh_data)

        } catch (error) {
            return reject(error)
        }
    })
}


app.listen(3000, async () => {
    redisClient.on('error', err => console.log('Redis Client Error', err))
    await redisClient.connect()
    console.log("server stated at port 3000")
})