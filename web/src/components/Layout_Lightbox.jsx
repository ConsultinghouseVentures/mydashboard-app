// Layout_Lightbox.jsx
import React, { useContext } from 'react';
import { Dialog } from '@mui/material';
import { LayoutContext } from './Layout_TableOverview.jsx';

const LayoutLightbox = ({ children, open, onClose, ...props }) => {
  const { lightboxStyles } = useContext(LayoutContext) || {};
  const defaultLightboxStyles = {
    paperProps: {
      style: { minWidth: 300, maxWidth: 400, maxHeight: 400 },
    },
    sx: { '& .MuiPaper-root': { p: 1 } },
    title: { p: 1, fontSize: '1rem' },
    content: { p: 1 },
    actions: { p: 1 },
  };
  const effectiveLightboxStyles = lightboxStyles || defaultLightboxStyles;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={effectiveLightboxStyles.paperProps}
      sx={effectiveLightboxStyles.sx}
      {...props}
    >
      {children}
    </Dialog>
  );
};

export default LayoutLightbox;