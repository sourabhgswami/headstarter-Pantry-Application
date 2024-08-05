'use client'
import next from 'next/image'
import { useState, useEffect } from 'react'
import { getFirestore, collection, doc, query, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { Box, Modal, Stack, TextField, Typography, Button, Paper, IconButton, Tooltip } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
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
  const [searchTerm, setSearchTerm] = useState('')

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
  if (!item.trim()) {
    alert("Item name cannot be empty");
    return;
  }
  const docRef = doc(collection(Firestore, 'inventory'), item.trim())
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

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Box width="100vw" height="100vh" 
    display="flex" justifyContent="center" 
    alignItems="center" flexDirection="column"
    sx={{ backgroundColor: '#f5f5f5' }}>
      <Modal open={open} onClose={handleClose}>
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            p: 4,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant='h5' fontWeight="bold">Add New Item</Typography>
            <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField
            variant='outlined'
            fullWidth
            label='Item Name'
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            variant='contained'
            color='primary'
            fullWidth
            size="large"
            onClick={() => {
              if (itemName.trim()) {
                addItem(itemName.trim())
                setItemName('')
                handleClose()
              } else {
                alert("Item name cannot be empty")
              }
            }}
            sx={{ 
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Add Item
          </Button>
        </Paper>
      </Modal>
      <Paper elevation={3} sx={{ width: '800px', p: 3, borderRadius: 2 }}>
        <Typography variant='h3' color="primary" mb={3} textAlign="center">Pantry Inventory</Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpen}
            startIcon={<AddIcon />}
          >
            Add New Item
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '60%', backgroundColor: 'white', borderRadius: 1 }}>
            <IconButton sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
            <TextField
              variant="standard"
              fullWidth
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ disableUnderline: true }}
            />
          </Box>
        </Box>
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box 
            bgcolor="primary.main"
            p={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant='h6' color="white" width="50%">Inventory Items</Typography>
            <Box display="flex" justifyContent="flex-end" alignItems="center" width="50%">
              <Typography variant='h6' color="white" sx={{ width: '80px', textAlign: 'center' }}>
                Quantity
              </Typography>
              <Typography variant='h6' color="white" sx={{ width: '80px', textAlign: 'center' }}>
                Add Item
              </Typography>
              <Typography variant='h6' color="white" sx={{ width: '80px', textAlign: 'center' }}>
                Remove Item
              </Typography>
            </Box>
          </Box>
          
          <Stack spacing={1} p={2}>
            {filteredInventory.map((item) => (
              <Paper key={item.name} elevation={2}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                  },
                }}
              >
                <Typography variant='h6' color="text.primary" width="50%">
                  {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                </Typography>
                <Box display="flex" justifyContent="flex-end" alignItems="center" width="50%">
                  <Typography variant='h6' color="text.secondary" sx={{ width: '80px', textAlign: 'center' }}>
                    {item.quantity}
                  </Typography>
                  <Box sx={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
                    <IconButton color='primary' onClick={() => addItem(item.name)}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
                    <IconButton color='primary' onClick={() => removeItem(item.name)}>
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Paper>
    </Box>
  )
}