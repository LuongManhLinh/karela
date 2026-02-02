import React, { ReactNode } from "react";
import { Container, Paper, Typography, Box, IconButton } from "@mui/material";
import { FilterAltOutlined as Filter } from "@mui/icons-material";
import { Layout } from "@/components/Layout";
import { UrlInformation } from "@/components/UrlInformation";
import { DefaultSessionFilterDialog } from "@/components/SessionDialog";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  basePath: string;
  filterSectionTitle: string;
  appBarTransparent?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  basePath,
  filterSectionTitle,
  appBarTransparent = true,
}) => {
  const [filterDialogOpen, setFilterDialogOpen] = React.useState(false);

  return (
    <Layout
      appBarLeftContent={
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
          <Typography variant="h5">{title}</Typography>
          {subtitle && (
            <Typography variant="h6" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      }
      appBarTransparent={appBarTransparent}
      basePath={basePath}
    >
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, overflowY: "auto" }}>
        {/* Filter Section */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {filterSectionTitle}
            </Typography>
            <IconButton onClick={() => setFilterDialogOpen(true)}>
              <Filter />
            </IconButton>
          </Box>
          <UrlInformation />
        </Paper>

        {/* Dashboard Content */}
        {children}

        <DefaultSessionFilterDialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
        />
      </Container>
    </Layout>
  );
};
