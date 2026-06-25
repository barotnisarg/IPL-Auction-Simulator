// client/src/pages/FinalResultsPage.jsx

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { fetchRoomByCode } from '../features/room/roomSlice';
import { fetchTeamsByRoom } from '../features/team/teamSlice';
import Loader from '../components/common/Loader';
import FinalTeamCard from '../components/results/FinalTeamCard';

// Mirrored from server/constants/roomConstants.js / auctionConstants.js.
const ROOM_STATUS_LOBBY = 'lobby';
const ROOM_STATUS_UNSOLD_SELECTION = 'unsold-selection';
const ROOM_STATUS_COMPLETED = 'completed';
const ACTIVE_BIDDING_STATUSES = ['marquee', 'pool1', 'pool2', 'mini-auction'];

// The inverse of every redirect table built so far (useAuctionRoom.js,
// UnsoldSelectionPage.jsx) — this page is the final destination, so anyone
// who arrives here before the auction has actually finished (a stale
// bookmark, a direct link shared too early) gets sent back to wherever the
// room genuinely is right now, instead of seeing an empty results page.
const redirectForStatus = (status, roomCode) => {
  if (status === ROOM_STATUS_LOBBY) return `/lobby/${roomCode}`;
  if (status === ROOM_STATUS_UNSOLD_SELECTION) return `/unsold-selection/${roomCode}`;
  if (ACTIVE_BIDDING_STATUSES.includes(status)) return `/auction/${roomCode}`;
  return null;
};

const FinalResultsPage = () => {
  const { roomCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { room, status: roomStatus } = useSelector((state) => state.room);
  const { teams } = useSelector((state) => state.team);

  useEffect(() => {
    dispatch(fetchRoomByCode(roomCode));
  }, [roomCode, dispatch]);

  useEffect(() => {
    if (room?._id) {
      dispatch(fetchTeamsByRoom(room._id));
    }
  }, [room?._id, dispatch]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const redirectTo = redirectForStatus(room.status, room.roomCode);

    if (redirectTo) {
      navigate(redirectTo, { replace: true });
    }
  }, [room, navigate]);

  if (roomStatus === 'loading' && !room) {
    return <Loader fullScreen label="Loading results..." />;
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

  if (!room || room.status !== ROOM_STATUS_COMPLETED) {
    return null;
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <Link
        to="/"
        className="text-sm font-semibold uppercase tracking-widest text-amber-400 hover:text-amber-300"
      >
        IPL Auction Simulator
      </Link>

      <h1 className="mt-4 text-3xl font-black text-neutral-100">Final Results</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Every franchise's final squad, spend, and budget for this auction.
      </p>

      {teams.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-600">No teams found for this room.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {teams.map((team) => (
            <FinalTeamCard key={team._id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FinalResultsPage;