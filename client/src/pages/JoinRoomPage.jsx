// client/src/pages/JoinRoomPage.jsx

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

import { joinRoom } from '../features/room/roomSlice';
import Button from '../components/common/Button';

const JoinRoomPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.room);

  const [formData, setFormData] = useState({ roomCode: '', teamName: '' });

  const isSubmitting = status === 'loading';

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === 'roomCode' ? value.toUpperCase() : value;
    setFormData((previous) => ({ ...previous, [name]: nextValue }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const result = await dispatch(joinRoom(formData)).unwrap();
      navigate(`/lobby/${result.data.room.roomCode}`);
    } catch {
      // Error is already captured in room state and rendered below.
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link
        to="/"
        className="mb-6 text-sm font-semibold uppercase tracking-widest text-amber-400 hover:text-amber-300"
      >
        IPL Auction Simulator
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-neutral-100">Join a room</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Enter the room code your host shared with you.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-neutral-300">
              Room code
            </label>
            <input
              id="roomCode"
              name="roomCode"
              type="text"
              autoComplete="off"
              required
              maxLength={6}
              value={formData.roomCode}
              onChange={handleChange}
              placeholder="e.g. 7K9X3M"
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono uppercase tracking-widest text-neutral-100 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-neutral-300">
              Your team name
            </label>
            <input
              id="teamName"
              name="teamName"
              type="text"
              autoComplete="off"
              required
              minLength={2}
              maxLength={40}
              value={formData.teamName}
              onChange={handleChange}
              placeholder="e.g. Chennai Challengers"
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Join Room
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Don&apos;t have a room yet?{' '}
          <Link to="/create-room" className="font-medium text-amber-400 hover:text-amber-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default JoinRoomPage;