'use client'
import next from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getFirestore, collection, doc, query, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Box, Modal, Stack, TextField, Typography, Button, Paper, IconButton, Tooltip, AppBar, Toolbar } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import KitchenIcon from '@mui/icons-material/Kitchen'
import DeleteIcon from '@mui/icons-material/Delete'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; // Import the magic wand icon
import { firebaseApp } from '@/firebase'  // Assuming this is how you initialize Firebase in your project
import Webcam from 'react-webcam'
import { createTheme, ThemeProvider } from '@mui/material/styles';

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

const convertToBase64 = (file, maxSize = 300) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
  });
}

// Function to classify the image using the API route
const classifyImage = async (file) => {
  try {
    const base64Image = await convertToBase64(file, 300);
    
    const response = await fetch('/api/classifyImages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate description: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    return data.description; // Return the description instead of the category
  } catch (error) {
    console.error("Error generating description:", error);
    return "Unable to generate description: " + error.message;
  }
};


// This function will be used in your `addItem` function to classify the image.


export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [image, setImage] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const webcamRef = useRef(null)
  const [itemQuantity, setItemQuantity] = useState(1)  // Add this line
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState('');

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

const addItem = async (item, imageFile, quantity) => {
  if (!item.trim()) {
    alert("Item name cannot be empty");
    return;
  }

  const docRef = doc(collection(Firestore, 'inventory'), item.trim());
  const docSnap = await getDoc(docRef);
  
  let imageUrl = null;
  let description = null;

  if (imageFile) {
    imageUrl = await uploadImage(imageFile);  // Upload image to Firebase Storage
    description = await classifyImage(imageFile);  // Generate description for the image
  }

  if (docSnap.exists()) {
    const { quantity: existingQuantity } = docSnap.data();
    const currentQuantity = isNaN(existingQuantity) ? 0 : existingQuantity;
    await setDoc(docRef, { 
      quantity: currentQuantity + quantity,
      imageUrl: imageUrl || docSnap.data().imageUrl,
      description: description || docSnap.data().description, // Store the description
    });
  } else {
    await setDoc(docRef, { 
      quantity: quantity,
      imageUrl: imageUrl,
      description: description, // Store the description
    });
  }

  await updateInventory();
};



const uploadImage = async (file) => {
  if (!file) return null;
  const storageRef = ref(storage, `items/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

const handleAddItem = () => {
  if (itemName.trim()) {
    addItem(itemName.trim(), image, itemQuantity);  // Update this line
    setItemName('');
    setImage(null);
    setItemQuantity(1);  // Reset quantity
    handleClose();
  } else {
    alert("Item name cannot be empty");
  }
};

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

  const deleteEntireItem = async (itemName) => {
    if (window.confirm(`Are you sure you want to delete ${itemName} from your inventory?`)) {
      const docRef = doc(collection(Firestore, 'inventory'), itemName);
      await deleteDoc(docRef);
      await updateInventory();
    }
  };

  const generateRecipe = async () => {
    try {
      const ingredients = inventory.map(item => `${item.name} (${item.quantity})`).join(', ');
      const response = await fetch('/api/generateRecipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }

      const data = await response.json();
      setGeneratedRecipe(data.recipe);
      setRecipeModalOpen(true);
    } catch (error) {
      console.error('Error generating recipe:', error);
      alert('Failed to generate recipe. Please try again.');
    }
  };

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

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot()
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" })
          setImage(file)
          setShowCamera(false)
        })
    }
  }, [webcamRef])

  // Create a custom theme
  const theme = createTheme({
    palette: {
      primary: {
        main: '#1a237e', // Dark blue
      },
      secondary: {
        main: '#f5f5f5', // Light gray
      },
      text: {
        primary: '#333333', // Dark gray for text
      },
    },
  });

  const RecipeModal = ({ isOpen, onClose, recipe }) => (
    <Modal open={isOpen} onClose={onClose}>
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          maxHeight: '80vh',
          overflowY: 'auto',
          p: 4,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant='h5' fontWeight="bold">Generated Recipe</Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body1">{recipe}</Typography>
      </Paper>
    </Modal>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', filter: recipeModalOpen ? 'blur(5px)' : 'none', transition: 'filter 0.3s ease-in-out' }}>
        <AppBar position="static" color="primary">
          <Toolbar>
            <KitchenIcon sx={{ mr: 2, fontSize: 32, color: 'secondary.main' }} />
            <Box>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'secondary.main', fontWeight: 'bold' }}>
                Pantry Inventory
              </Typography>
              <Typography variant="subtitle2" sx={{ color: 'secondary.main', opacity: 0.8 }}>
                Organize your kitchen, simplify your life
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 2, backgroundColor: 'secondary.main', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpen}
                startIcon={<AddIcon />}
                sx={{ mr: 2 }}
              >
                Add New Item
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={generateRecipe}
                startIcon={<AutoFixHighIcon />}
              >
                Generate Recipe
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '50%', backgroundColor: 'white', borderRadius: 1 }}>
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
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box 
              bgcolor="primary.main"
              p={1}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant='subtitle1' color="white" width="25%" pl={1}>Item</Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" width="75%">
                <Typography variant='subtitle1' color="white" sx={{ width: '40px', textAlign: 'center' }}>Qty</Typography>
                <Typography variant='subtitle1' color="white" sx={{ flex: 1, textAlign: 'left', pl: 2 }}>Description</Typography>
                <Typography variant='subtitle1' color="white" sx={{ width: '80px', textAlign: 'center' }}>Actions</Typography>
              </Box>
            </Box>
            
            <Stack spacing={1} p={1} sx={{ overflowY: 'auto', flexGrow: 1 }}>
              {filteredInventory.map((item) => (
                <Paper key={item.name} elevation={1}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" width="25%">
                    {item.imageUrl && (
                      <Box mr={1} width={40} height={40} overflow="hidden" borderRadius={1} sx={{ cursor: 'pointer' }} onClick={() => setZoomImage(item.imageUrl)}>
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    )}
                    <Typography variant='body1' color="text.primary" noWrap>
                      {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" width="75%">
                    <Typography variant='body2' color="text.secondary" sx={{ width: '40px', textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <Typography variant='body2' color="text.secondary" sx={{ flex: 1, pl: 2, pr: 1, whiteSpace: 'normal', overflow: 'visible' }}>
                      {item.description || 'N/A'}
                    </Typography>
                    <Box sx={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
                      <IconButton size="small" color='primary' onClick={() => addItem(item.name)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color='primary' onClick={() => removeItem(item.name)}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color='error' onClick={() => deleteEntireItem(item.name)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Box>
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
            <TextField
              variant='outlined'
              fullWidth
              label='Quantity'
              type="number"
              InputProps={{ inputProps: { min: 1 } }}
              value={itemQuantity}
              onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              sx={{ mb: 3 }}
            />
            <Box mb={2}>
              <Button
                variant="outlined"
                component="span"
                fullWidth
                onClick={() => setShowCamera(true)}
                sx={{ mb: 1 }}
              >
                Take Picture
              </Button>
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
                >
                  Upload Image
                </Button>
              </label>
            </Box>
            {showCamera && (
              <Box mb={2}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'environment' }}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={captureImage}
                >
                  Capture Image
                </Button>
              </Box>
            )}
            {image && (
              <Typography variant="body2" mb={2}>
                {image.name.startsWith('captured_image') ? 'Image captured' : `Selected image: ${image.name}`}
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
        <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
        <RecipeModal 
          isOpen={recipeModalOpen} 
          onClose={() => setRecipeModalOpen(false)} 
          recipe={generatedRecipe} 
        />
      </Box>
    </ThemeProvider>
  )
}