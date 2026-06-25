// client/src/pages/AuctionPage.jsx

import { useParams } from 'react-router-dom';

import useAuctionRoom from '../hooks/useAuctionRoom';
import Loader from '../components/common/Loader';
import HostControls from '../components/lobby/HostControls';
import AuctionPlayerCard from '../components/auction/AuctionPlayerCard';
import BidControls from '../components/auction/BidControls';
import HistoryPanel from '../components/auction/HistoryPanel';
import MyTeamPanel from '../components/auction/MyTeamPanel';
import OtherTeamsPanel from '../components/auction/OtherTeamsPanel';

const AuctionPage = () => {
  const { roomCode } = useParams();
  const { room, roomStatus } = useAuctionRoom(roomCode);

  if (roomStatus === 'loading' && !room) {
    return <Loader fullScreen label="Loading auction..." />;
  }

  if (roomStatus === 'failed' && !room) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-neutral-100">Room not found.</p>
        <p className="mt-2 text-sm text-neutral-400">
          Double check the link, or ask your host to share the room code again.
        </p>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <HostControls />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AuctionPlayerCard />
          <BidControls />
          <HistoryPanel type="bid" />
        </div>

        <div className="space-y-6">
          <MyTeamPanel />
          <OtherTeamsPanel />
          <HistoryPanel type="auction" />
        </div>
      </div>
    </div>
  );
};

export default AuctionPage;