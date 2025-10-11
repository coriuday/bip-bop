import React from 'react';

interface FriendRequestProps {
  isRequested: boolean;
  onRequest: () => void;
}

const FriendRequest: React.FC<FriendRequestProps> = ({ isRequested, onRequest }) => {
  return (
    <button className={`btn btn-sm ${isRequested ? 'btn-secondary' : 'btn-primary'} mt-2`} onClick={onRequest}>
      {isRequested ? 'Requested' : 'Send Friend Request'}
    </button>
  );
};

export default FriendRequest;
