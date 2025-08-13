import React, { createContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Box, IconButton, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

export const LayoutContext = createContext();

const LayoutTableOverview = ({ children, showBackTop = true, showBackBottom = true }) => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');

  useEffect(() => {
    const handleSidebarToggle = () => {
      setIsSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
      console.log('Sidebar toggle event, isCollapsed:', localStorage.getItem('sidebarCollapsed') === 'true');
    };
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);

  // Define styles within the component
  const styles = {
    container: {
      maxWidth: false,
      ml: {
        xs: 0,
        sm: isSidebarCollapsed ? '0px' : '60px',
        md: isSidebarCollapsed ? '0px' : '60px',
      },
      mr: { xs: 60, sm: 60, md: 60 },
      p: { xs: '8px 8px 8px 8px', sm: '16px 16px 16px 16px' },
      pt: 0,
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'auto',
      position: 'relative',
      top: '-64px',
    },
    backButtonTop: {
      position: 'absolute',
      top: 0,
      right: 60,
    },
    spacerBox: {
      height: 65,
    },
    contentBox: {
      width: '100%',
      mt: '65px',
      minWidth: '800px',
      position: 'relative',
    },
    backButtonBottomContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      mt: 2,
      mb: 4,
      paddingRight: '70px',
      boxSizing: 'border-box',
      minWidth: '800px',
    },
    backButtonBottom: {
      mr: 0,
    },
    dialog: {
      PaperProps: {
        style: { maxHeight: 400, width: 975 },
      },
      sx: { '& .MuiPaper-root': { p: 1 } },
    },
    lightbox: {
      PaperProps: {
        style: { minWidth: 300, maxWidth: 400, maxHeight: 400 },
      },
      sx: { '& .MuiPaper-root': { p: 1 } },
      title: { p: 1, fontSize: '1rem' },
      content: { p: 1 },
      actions: { p: 1 },
    },
    table: {
      backgroundColor: 'white',
      borderRadius: 1,
      minWidth: '800px',
      maxWidth: '100%',
      boxSizing: 'border-box',
      '& .MuiDataGrid-root': {
        overflowX: 'auto',
        maxWidth: '100%',
      },
      '& .MuiDataGrid-columnHeaders': {
        backgroundColor: '#f5f5f5',
      },
      '& .MuiDataGrid-cell': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        border: 'none',
        '&:focus': {
          outline: 'none',
          border: 'none',
          boxShadow: 'none',
        },
        '&:focus-within': {
          outline: 'none',
          border: 'none',
          boxShadow: 'none',
        },
        '&.MuiDataGrid-cell--withRenderer': {
          '&:focus': {
            outline: 'none',
            border: 'none',
            boxShadow: 'none',
          },
          '&:focus-within': {
            outline: 'none',
            border: 'none',
            boxShadow: 'none',
          },
        },
      },
      '& .MuiDataGrid-cell:focus .MuiDataGrid-cellContent': {
        outline: 'none',
        border: 'none',
        boxShadow: 'none',
      },
    },
  };

  return (
    <LayoutContext.Provider value={{ isSidebarCollapsed, dialogStyle: styles.dialog, lightboxStyles: styles.lightbox, tableStyles: styles.table }}>
      <Container sx={styles.container}>
        {showBackTop && (
          <IconButton
            sx={styles.backButtonTop}
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
          >
            <ArrowBack />
          </IconButton>
        )}
        <Box sx={styles.spacerBox} />
        <Box sx={styles.contentBox}>
          {children}
          {showBackBottom && (
            <Box sx={styles.backButtonBottomContainer}>
              <Button
                component={Link}
                to="/dashboard"
                variant="text"
                color="primary"
                sx={styles.backButtonBottom}
                aria-label="Back to dashboard"
              >
                Back
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </LayoutContext.Provider>
  );
};

export { LayoutTableOverview };