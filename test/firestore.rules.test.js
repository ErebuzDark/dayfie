// Minimal Firestore rules unit test scaffold using @firebase/rules-unit-testing
// Install: npm i -D @firebase/rules-unit-testing firebase

import { initializeTestApp, loadFirestoreRules, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import fs from 'fs'

const PROJECT_ID = 'dayfie-test'

async function setup() {
  const rules = fs.readFileSync('./firestore.rules', 'utf8')
  await loadFirestoreRules({ projectId: PROJECT_ID, rules })
}

async function runTests() {
  await setup()

  // Unauthenticated app - should not be able to create comments
  const unauth = initializeTestApp({ projectId: PROJECT_ID })
  const unauthDb = unauth.firestore()
  await assertFails(unauthDb.collection('posts').doc('p1').collection('comments').add({ text: 'x' }))

  // Authenticated user can create top-level comment
  const auth = initializeTestApp({ projectId: PROJECT_ID, auth: { uid: 'user1' } })
  const authDb = auth.firestore()
  await assertSucceeds(authDb.collection('posts').doc('p1').set({ authorId: 'user1' }))
  await assertSucceeds(authDb.collection('posts').doc('p1').collection('comments').add({ text: 'hello', authorId: 'user1', createdAt: Date.now(), updatedAt: Date.now(), parentId: null }))

  console.log('Basic rules smoke tests passed (manual run).')
}

runTests().catch((e) => { console.error(e); process.exit(1) })
