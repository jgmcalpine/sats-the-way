import React, { useMemo } from 'react';
import { Card, Typography, Box } from '@mui/material';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';

interface BookCardProps {
	id: string | number;
	title: string;
	authorPubkey?: string;
	authorName?: string;
	minCost?: number;
	coverArtUrl?: string;
	width?: number;
	height?: number;
}

const getRandomLightColor = (): string => {
	const r = Math.floor(Math.random() * 60) + 180;
	const g = Math.floor(Math.random() * 60) + 180;
	const b = Math.floor(Math.random() * 60) + 180;
	return `rgb(${r}, ${g}, ${b})`;
};

const BookCard: React.FC<BookCardProps> = ({
	title,
	authorPubkey,
	minCost,
	authorName,
	coverArtUrl,
	width = 200,
	height = 300,
}) => {
	const backgroundColor = useMemo(() => getRandomLightColor(), []);

	const displayAuthor =
		authorName || `${authorPubkey?.slice(0, 5)}...${authorPubkey?.slice(-3)}`;

	return (
		<div
			className="relative transition-transform duration-300 ease-in-out"
			style={{
				width,
				height,
				perspective: 1000,
			}}
		>
			{/* Hoverable tilt wrapper */}
			<div
				className="w-full h-full"
				style={{
					transformStyle: 'preserve-3d',
				}}
				onMouseEnter={(e) =>
					(e.currentTarget.style.transform = 'rotateY(3deg) rotateX(2deg)')
				}
				onMouseLeave={(e) =>
					(e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg)')
				}
			>
				{/* Spine */}
				<div
					className="absolute top-0 left-0 h-full"
					style={{
						width: 12,
						background:
							'linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.05))',
						borderTopLeftRadius: 8,
						borderBottomLeftRadius: 8,
						zIndex: 10,
					}}
				/>

				{/* Light paper bottom edge */}
				<div
					className="absolute bottom-0 left-2 right-0 h-4 rounded-br-sm"
					style={{
						background:
							'linear-gradient(to right, #f9f9f9, #eeeeee, #f9f9f9)',
						transform: 'skewX(-10deg) translateX(-3px)',
						zIndex: 5,
					}}
				/>

				{/* Card */}
				<Card
					className="absolute top-0 left-0 overflow-hidden flex flex-col h-full w-full"
					sx={{
						boxShadow:
							'0 10px 20px -5px rgba(0, 0, 0, 0.3), 0 5px 10px -3px rgba(0, 0, 0, 0.1)',
						backgroundImage: coverArtUrl ? `url(${coverArtUrl})` : 'none',
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						backgroundColor: coverArtUrl ? undefined : backgroundColor,
						color: coverArtUrl ? 'white' : 'black',
						position: 'relative',
						padding: 2,
						borderRadius: 2,
						transition: 'transform 0.3s ease',
					}}
				>
					{/* Overlay for readability */}
					{coverArtUrl && (
						<Box
							className="absolute inset-0"
							sx={{
								background:
									'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.2), rgba(0,0,0,0.6))',
								zIndex: 0,
							}}
						/>
					)}

					{/* Content */}
					<Box className="relative z-10 flex flex-col h-full">
						{/* Title */}
						<Box className="flex-grow-0 text-center px-1 mt-2">
							<Typography
								variant="h5"
								component="h3"
								sx={{
									fontWeight: 700,
									textShadow: coverArtUrl
										? '1px 1px 3px rgba(0,0,0,0.8)'
										: 'none',
									wordBreak: 'break-word',
									lineHeight: 1.2,
								}}
							>
								{title}
							</Typography>
						</Box>

						<Box className="flex-grow" />

						{/* Footer metadata */}
						<Box
							className="absolute bottom-2 left-2 right-2"
							sx={{
								zIndex: 20,
							}}
						>
							<Box className="flex flex-wrap items-center gap-1">
								{/* Author */}
								<Typography
									variant="caption"
									sx={{
										backgroundColor: 'rgba(0,0,0,0.4)',
										backdropFilter: 'blur(2px)',
										color: '#fff',
										fontWeight: 500,
										fontSize: '0.7rem',
										paddingX: 0.5,
										borderRadius: '4px',
										maxWidth: '100%',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										flex: '1 1 auto',
										minWidth: 0,
									}}
								>
									by {displayAuthor}
								</Typography>

								{/* Min cost */}
								<Box
									className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded-sm"
									sx={{
										color: '#f7931a',
										fontWeight: 600,
										fontSize: '0.75rem',
										flex: '0 0 auto',
									}}
								>
									<CurrencyBitcoinIcon sx={{ fontSize: '1rem' }} />
									{minCost ? minCost : 'Free'}
								</Box>
							</Box>
						</Box>
					</Box>
				</Card>
			</div>
		</div>
	);
};

export default BookCard;
