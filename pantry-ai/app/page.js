'use client'
import next from 'next/image'
import { useState, useEffect } from 'react'
import { getFirestore, collection, doc, query, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { Box, Modal, Stack, TextField, Typography, Button } from "@mui/material"
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
  const [open, setOpen] = useState(true)
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
  
//function to add items to inventory 

const addItem = async(item) => {
  const docRef = doc(collection(Firestore, 'inventory'), item)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    const { quantity } = docSnap.data()
    // Check if quantity is a number, if not, set it to 0
    const currentQuantity = isNaN(quantity) ? 0 : quantity
    await setDoc(docRef, { quantity: currentQuantity + 1 })
  } else {
    await setDoc(docRef, { quantity: 1 })
  }
  await updateInventory()
}

  const removeItem = async(item) => {
    const docRef = doc(collection(Firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()){
      const {quantity} = docSnap.data()
      const currentQuantity = isNaN(quantity) ? 0 : quantity
      if (currentQuantity <= 1){
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, {quantity: currentQuantity - 1})
      }
    }
    await updateInventory()
  }


  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <Box width="100vw" height="100vh" 
    display="flex" justifyContent="center" 
    alignItems="center" flexDirection="column">
      <Modal open = {open} onClose = {handleClose}>
        <Box position="absolute" top="50%" left="50%" bgcolor="white" p={4} border="2px solid #000" borderRadius={2} boxShadow={24} flexDirection="column" gap={3}
        sx={{
          transform: 'translate(-50%, -50%)',
        }}>
          <Typography variant='h1'>Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
            variant='outlined'
            fullWidth
            label='Item Name'
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            />
            <Button
            variant='outlined'
            color='primary'
            onClick={() => {
              addItem(itemName)
              setItemName('')
              handleClose()
            }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        ADD NEW ITEM
      </Button>
      <Box width="800px" border="2px solid #333" borderRadius={2} overflow="hidden">
        <Box 
          bgcolor="#ADD8E6"
          p={2}
          borderBottom="2px solid #333"
        >
          <Typography variant='h4' color="#333">Inventory Items</Typography>
        </Box>
        
        <Stack spacing={1} p={2}>
          {inventory.map((item) => (
            <Box key={item.name} 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              bgcolor="#f0f0f0" 
              p={2} 
              borderRadius={1}
            >
              <Typography variant='h6' color="#333" width="30%">
                {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" width="70%">
                <Typography variant='h6' color="#333" width="20%" textAlign="center">
                  {item.quantity}
                </Typography>
                <Box width="40%" display="flex" justifyContent="center">
                  <Button variant='contained' color='primary' onClick={() => addItem(item.name)}>
                    Add
                  </Button>
                </Box>
                <Box width="40%" display="flex" justifyContent="flex-end">
                  <Button variant='contained' color='primary' onClick={() => removeItem(item.name)}>
                    REMOVE
                  </Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}