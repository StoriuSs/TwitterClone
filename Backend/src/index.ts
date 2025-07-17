import express from 'express'
const app = express()
const port = 3000

const sum = (obj: { a: number; b: number }) => {
    console.log(obj)
    return obj.a + obj.b
}

app.get('/', (req, res) => {
    res.send(`Hello World! The sum is: ${sum({ a: 5, b: 10 })}`)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
