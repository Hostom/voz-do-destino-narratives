-- Enable realtime for characters table to ensure HP/XP updates are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE characters;