import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyB7VVTTKQ83x7mHe6ASBzyfNhHM6TKET_4",
  authDomain: "swiftstore-ea35a.firebaseapp.com",
  projectId: "swiftstore-ea35a",
  storageBucket: "swiftstore-ea35a.firebasestorage.app",
  messagingSenderId: "24306483811",
  appId: "1:24306483811:web:af3d0e7d74bc5c27d0ae56",
  measurementId: "G-D8PKDK6FQ8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  {
    name: "Classic White Sneakers",
    description: "Comfortable and stylish everyday sneakers with a minimalist design.",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2000&auto=format&fit=crop",
    category: "Footwear",
    stock: 45,
    createdAt: new Date().toISOString()
  },
  {
    name: "Minimalist Leather Backpack",
    description: "Durable genuine leather backpack perfect for daily commute or travel.",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=2000&auto=format&fit=crop",
    category: "Accessories",
    stock: 20,
    createdAt: new Date().toISOString()
  },
  {
    name: "Stainless Steel Water Bottle",
    description: "Double-walled vacuum insulated bottle keeps drinks cold for 24 hours.",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=2000&auto=format&fit=crop",
    category: "Lifestyle",
    stock: 150,
    createdAt: new Date().toISOString()
  },
  {
    name: "Wireless Noise-Canceling Headphones",
    description: "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=2000&auto=format&fit=crop",
    category: "Electronics",
    stock: 15,
    createdAt: new Date().toISOString()
  },
  {
    name: "Organic Cotton T-Shirt",
    description: "Soft, breathable, and sustainably made cotton t-shirt in classic black.",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
    category: "Apparel",
    stock: 80,
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  console.log('Starting to seed products...');
  for (const product of products) {
    try {
      const docRef = await addDoc(collection(db, 'products'), product);
      console.log('Added product with ID:', docRef.id);
    } catch (e) {
      console.error('Error adding product:', e);
    }
  }
  console.log('Seeding complete.');
  process.exit(0);
}

seed();
