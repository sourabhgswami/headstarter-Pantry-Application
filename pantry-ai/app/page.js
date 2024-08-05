'use client'
import next from 'next/image'
import { useState, useEffect } from 'react'
import { getFirestore, collection, doc, query, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Box, Modal, Stack, TextField, Typography, Button, Paper, IconButton, Tooltip } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import { firebaseApp } from '@/firebase'  // Assuming this is how you initialize Firebase in your project

const Firestore = getFirestore(firebaseApp)
const storage = getStorage(firebaseApp)

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
  const [image, setImage] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)

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

const addItem = async(item, imageFile) => {
  if (!item.trim()) {
    alert("Item name cannot be empty");
    return;
  }
  const docRef = doc(collection(Firestore, 'inventory'), item.trim())
  const docSnap = await getDoc(docRef)
  
  let imageUrl = null;
  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
  }

  if (docSnap.exists()) {
    const { quantity } = docSnap.data()
    // Check if quantity is a number, if not, set it to 0
    const currentQuantity = isNaN(quantity) ? 0 : quantity
    await setDoc(docRef, { 
      quantity: currentQuantity + 1,
      imageUrl: imageUrl || docSnap.data().imageUrl
    })
  } else {
    await setDoc(docRef, { 
      quantity: 1,
      imageUrl: imageUrl
    })
  }
  await updateInventory()
}

const uploadImage = async (file) => {
  if (!file) return null;
  const storageRef = ref(storage, `items/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

const handleAddItem = () => {
  if (itemName.trim()) {
    addItem(itemName.trim(), image);
    setItemName('');
    setImage(null);
    handleClose();
  } else {
    alert("Item name cannot be empty");
  }
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

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  const ImageZoomModal = ({ image, onClose }) => (
    <Modal open={!!image} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 2,
          borderRadius: 2,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
        <img
          src={image}
          alt="Zoomed item"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Box>
    </Modal>
  );

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
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <label htmlFor="image-upload">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              sx={{ mb: 2 }}
            >
              {image ? 'Change Image' : 'Add Image (Optional)'}
            </Button>
          </label>
          {image && (
            <Typography variant="body2" mb={2}>
              Selected image: {image.name}
            </Typography>
          )}
          <Button
            variant='contained'
            color='primary'
            fullWidth
            size="large"
            onClick={handleAddItem}
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
                <Box display="flex" alignItems="center" width="50%">
                  {item.imageUrl && (
                    <Box mr={2} width={50} height={50} overflow="hidden" borderRadius={1} sx={{ cursor: 'pointer' }} onClick={() => setZoomImage(item.imageUrl)}>
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  )}
                  <Typography variant='h6' color="text.primary">
                    {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                  </Typography>
                </Box>
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
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </Box>
  )
}