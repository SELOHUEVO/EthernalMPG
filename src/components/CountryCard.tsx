
import React from 'react';
import { Country } from '../types';
import './CountryCard.css';

interface CountryCardProps {
  country: Country;
  compact?: boolean;
  onClick?: () => void;
}

export function CountryCard({ country, compact, onClick }: CountryCardProps) {
  return (
    <div className={`country-card ${compact ? 'compact' : ''} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="country-card-flag">{country.flag}</div>
      <div className="country-card-info">
        <h4 className="country-card-name">{country.name}</h4>
        {!compact && (
          <>
            <p className="country-card-government">{country.government}</p>
            <p className="country-card-capital">🏛 Столица: {country.capital}</p>
          </>
        )}
      </div>
      <div className="country-card-status">
        {country.userId ? (
          <span className="status-taken">Занята</span>
        ) : (
          <span className="status-available">Свободна</span>
        )}
      </div>
    </div>
  );
}
