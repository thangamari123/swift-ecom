import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user role
        try {
          let role: 'customer' | 'admin' = 'customer';
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || 'customer';
          }
          
          if (user.email) {
            const adminQuery = query(collection(db, 'adminUsers'), where('email', '==', user.email));
            const adminDocs = await getDocs(adminQuery);
            if (!adminDocs.empty) {
              const adminData = adminDocs.docs[0].data();
              if (adminData.status !== 'Inactive') {
                role = adminData.role || 'Administrator';
              }
            }
          }
          
          if (user?.email === 'editztm3@gmail.com') {
            role = 'admin';
          }
          
          setUser(user, role);
        } catch (e) {
          console.log("Error fetching role", e);
          setUser(user, 'customer');
        }
      } else {
        setUser(null, null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}

