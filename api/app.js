const express = require('express')
const app = express()
const port = 8000

app.get('/item/1/', (req, res) => {
  res.json(
    { 
      name: "Netherite Sword",
      description: "Strongest sword in the game",
      artUrl: "https://bit.ly/33wkOGX"
    }
  )
})

app.get('/item/2/', (req, res) => {
  res.json(
    { 
      name: "Lucky Potion",
      description: "Makes you invincible",
      artUrl: "https://bit.ly/3fPzJRo"
    }
  )
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})