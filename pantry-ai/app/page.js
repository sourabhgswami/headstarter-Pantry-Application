'use client'
import next from 'next/image'
import { useState, useEffect } from 'react'
import { getFirestore, collection, doc, query, getDocs, getDoc, setDoc } from 'firebase/firestore'
import { Box, Stack, Typography } from "@mui/material"
import { firebaseApp } from '@/firebase'  // Assuming this is how you initialize Firebase in your project

const Firestore = getFirestore(firebaseApp)

const item = [
  'tomato',
  'potato',
  'onion',
  'garlic',
  'ginger',
  'carrot',
  'lettuce',
  'kale',
  'cucumber'
]

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')

  const updateInventory = async () => {
    const snapshot = query(collection(Firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    setInventory(inventoryList)
    console.log(inventoryList)
  }
  
  const removeItem = async(item) =>{
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()){
      const {quantity} = docSnap.data()
      if (quantity === 1){
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, {quantity: quantity - 1})
      }
    }
    await updateInventory()
  }


  useEffect(() => {
    updateInventory()
  }, [])

  return (
    <Box>
      <Typography variant='h1'>Inventory Management</Typography>
      {inventory.map((item) => {
        console.log(item)
        return (
          <Box key={item.name}>
            {item.name}
            {item.count}
          </Box>
        )
      })}
    </Box>
  )
}
