const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())

app.get('/', (req, res) => {
   res.send('BERR 2434 Databas and Cloud')
})

app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})
