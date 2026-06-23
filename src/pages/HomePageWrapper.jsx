import { useOutletContext } from 'react-router-dom'
import HomePage from './HomePage'

export default function HomePageWrapper() {
  const { onNewPost, onEditPost } = useOutletContext()
  return <HomePage onNewPost={onNewPost} onEditPost={onEditPost} />
}
