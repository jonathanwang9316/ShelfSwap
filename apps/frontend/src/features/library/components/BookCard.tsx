import { FC } from 'react'
import { getBookCoverUrl } from '@/api/axios'

type BookCardProps = {
  copyID: number
  title: string
  author: string
  isbn: string
  genre?: string
  condition?: string
  canExchange?: boolean
  yearPublished?: number
  averageRating?: number
  userRating?: number
  onDelete?: (copyID: number) => void
  onClick?: () => void
}

const BookCard: FC<BookCardProps> = ({ 
  copyID,
  title, 
  author, 
  isbn, 
  genre, 
  condition,
  canExchange,
  averageRating,
  userRating,
  onDelete,
  onClick
}) => {
  const coverUrl = getBookCoverUrl(isbn)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      onDelete?.(copyID)
    }
  }

  // The HTML code was developed using AI assistance
  return (
    <div 
      onClick={onClick}
      style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      width: '250px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        width: '100%', 
        height: '280px', 
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <img 
          src={coverUrl}
          alt={`${title} cover`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"%3E%3Crect fill="%23ddd" width="200" height="280"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23666"%3ENo Cover%3C/text%3E%3C/svg%3E'
          }}
        />
      </div>
      <h3 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '16px',
        fontWeight: '600',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {title}
      </h3>
      <p style={{ 
        margin: '0 0 4px 0', 
        color: '#666',
        fontSize: '14px'
      }}>
        by {author}
      </p>
      {genre && (
        <p style={{ 
          margin: '0 0 4px 0', 
          color: '#888',
          fontSize: '12px',
          fontStyle: 'italic'
        }}>
          {genre}
        </p>
      )}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '8px 0' }}>
        {userRating && (
          <div style={{ 
            fontSize: '14px',
            color: '#007bff',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ fontSize: '16px' }}>★</span>
            <span>{userRating}</span>
            <span style={{ fontSize: '11px', color: '#666', fontWeight: '400' }}>You</span>
          </div>
      )}
      {averageRating && (
        <div style={{ 
          fontSize: '14px',
            color: '#f39c12',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        }}>
            <span>⭐</span>
            <span>{averageRating.toFixed(1)}</span>
            <span style={{ fontSize: '11px', color: '#666' }}>Avg</span>
        </div>
      )}
      </div>
      <div style={{ 
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '12px',
            padding: '4px 8px',
            backgroundColor: condition === 'New' ? '#d4edda' : 
                            condition === 'Like New' ? '#d1ecf1' : 
                            condition === 'Good' ? '#fff3cd' : '#f8d7da',
            color: condition === 'New' ? '#155724' : 
                   condition === 'Like New' ? '#0c5460' : 
                   condition === 'Good' ? '#856404' : '#721c24',
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            {condition || 'Good'}
          </span>
          {canExchange && (
            <span style={{
              fontSize: '12px',
              padding: '4px 8px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              ✓ Available
            </span>
          )}
        </div>
        
        {onDelete && (
          <button
            onClick={handleDelete}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              color: '#dc3545',
              border: 'none',
              borderRadius: '4px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#dc3545'
            }}
            title="Delete book"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default BookCard
