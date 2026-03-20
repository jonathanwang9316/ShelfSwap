import { FC } from 'react'
import { useParams } from 'react-router-dom'
import RatingStars from '../components/RatingStars'

const BookDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()

  // The HTML code was developed using AI assistance
  return (
    <div>
      <h1>Book Detail Page</h1>
      <p>Book ID: {id}</p>
      <h2>Reviews</h2>
      <RatingStars />
    </div>
  )
}

export default BookDetailPage
