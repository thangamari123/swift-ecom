import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useStore();

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;
    let unsubscribeAdminDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listeners if auth state changes
      if (unsubscribeUserDoc) { unsubscribeUserDoc(); unsubscribeUserDoc = null; }
      if (unsubscribeAdminDoc) { unsubscribeAdminDoc(); unsubscribeAdminDoc = null; }

      if (user) {
        if (user.email === 'editztm3@gmail.com') {
          setUser(user, 'admin');
          return;
        }

        let roleFromUserDoc = 'customer';
        let roleFromAdminDoc: string | null = null;
        let isInactiveAdmin = false;

        const updateRole = () => {
          if (roleFromAdminDoc && !isInactiveAdmin) {
            setUser(user, roleFromAdminDoc);
          } else {
            setUser(user, roleFromUserDoc);
          }
        };

        // Real-time listener for normal user doc
        unsubscribeUserDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            roleFromUserDoc = docSnap.data().role || 'customer';
          } else {
            roleFromUserDoc = 'customer';
          }
          updateRole();
        }, (error) => {
          console.error("User doc listener error:", error);
          updateRole();
        });

        // Real-time listener for admin user doc
        if (user.email) {
          const adminQuery = query(collection(db, 'adminUsers'), where('email', '==', user.email));
          unsubscribeAdminDoc = onSnapshot(adminQuery, (snapshot) => {
            if (!snapshot.empty) {
              const adminData = snapshot.docs[0].data();
              isInactiveAdmin = adminData.status === 'Inactive';
              roleFromAdminDoc = adminData.role || 'Administrator';
            } else {
              roleFromAdminDoc = null;
              isInactiveAdmin = false;
            }
            updateRole();
          }, (error) => {
            console.error("Admin query listener error:", error);
            updateRole();
          });
        }
      } else {
        setUser(null, null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (unsubscribeAdminDoc) unsubscribeAdminDoc();
    };
  }, [setUser]);

  return <>{children}</>;
}

