-- Add lat/lng coordinates for map pins
alter table hotels add column if not exists lat double precision;
alter table hotels add column if not exists lng double precision;

alter table activities add column if not exists lat double precision;
alter table activities add column if not exists lng double precision;

alter table itinerary_items add column if not exists lat double precision;
alter table itinerary_items add column if not exists lng double precision;
