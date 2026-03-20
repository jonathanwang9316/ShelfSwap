import { FC, useState } from 'react'

const RatingStars: FC = () => {
  const [rating, setRating] = useState(0)

  // The HTML code was developed using AI assistance
  return (
    <div>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => setRating(star)}
          style={{ cursor: 'pointer' }}
        >
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  )
}

export default RatingStars
