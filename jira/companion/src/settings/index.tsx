import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Box,
  Button,
  Heading,
  Inline,
  LoadingButton,
  Spinner,
  Stack,
  Text,
  TextArea,
  Textfield,
  SectionMessage,
  SectionMessageAction,
} from "@forge/react";
import SettingsService from "./settingsService";
import { ProjectSettings } from "./types";

interface AdditionalDoc {
  id: string;
  title: string;
  content: string;
}

const SettingField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <Box>
    <Heading size="small">{label}</Heading>
    <TextArea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
    />
  </Box>
);

const AdditionalSettingsSection = ({
  additionalDocs,
  setDocs,
  title,
}: {
  additionalDocs: AdditionalDoc[];
  setDocs: (docs: AdditionalDoc[]) => void;
  title: string;
}) => {
  const addDocumentationSection = () => {
    const newId = `doc-${Date.now()}`;
    setDocs([...additionalDocs, { id: newId, title: "", content: "" }]);
  };

  const removeDocumentationSection = (id: string) => {
    setDocs(additionalDocs.filter((doc) => doc.id !== id));
  };

  const updateDocTitle = (id: string, title: string) => {
    setDocs(
      additionalDocs.map((doc) => (doc.id === id ? { ...doc, title } : doc))
    );
  };

  const updateDocContent = (id: string, content: string) => {
    setDocs(
      additionalDocs.map((doc) => (doc.id === id ? { ...doc, content } : doc))
    );
  };

  return (
    <Box>
      <Heading size="small">{title}</Heading>
      <Stack space="space.300">
        {additionalDocs.map((doc) => (
          <Box
            key={doc.id}
            xcss={{
              paddingTop: "space.300",
              paddingBottom: "space.300",
            }}
          >
            <Stack space="space.200">
              <Box>
                <Text weight="medium">Document Title</Text>
                <Textfield
                  value={doc.title}
                  onChange={(e) => updateDocTitle(doc.id, e.target.value)}
                  placeholder="Enter document title..."
                />
              </Box>
              <Box>
                <Text weight="medium">Document Content</Text>
                <TextArea
                  value={doc.content}
                  onChange={(e) => updateDocContent(doc.id, e.target.value)}
                  placeholder="Enter document content..."
                />
              </Box>
              <Box>
                <Button
                  onClick={() => removeDocumentationSection(doc.id)}
                  appearance="warning"
                >
                  Remove Section
                </Button>
              </Box>
            </Stack>
          </Box>
        ))}

        <Box>
          <Button
            onClick={addDocumentationSection}
            appearance="subtle"
            iconBefore="add"
          >
            Add
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState(true);
  const [msg, setMsg] = useState<string>("");
  const [showMsg, setShowMsg] = useState(false);

  // Base fields
  const [productVision, setProductVision] = useState("");
  const [productScope, setProductScope] = useState("");
  const [sprintGoals, setSprintGoals] = useState("");
  const [glossary, setGlossary] = useState("");
  const [constraints, setConstraints] = useState("");
  const [additionalDocs, setAdditionalDocs] = useState<AdditionalDoc[]>([]);

  const [guidelines, setGuidelines] = useState("");
  const [additionalContexts, setAdditionalContexts] = useState<AdditionalDoc[]>(
    []
  );

  const loadSettings = async () => {
    setLoading(true);
    setShowMsg(false);
    setMsg("");

    const loadAdditionalDocs = (
      docs: { [key: string]: string } | undefined
    ) => {
      const docsArray: AdditionalDoc[] = [];
      if (docs) {
        let docIdx = 0;
        Object.entries(docs).forEach(([key, value]) => {
          docsArray.push({
            id: `doc-${docIdx}`,
            title: key,
            content: value,
          });
          docIdx++;
        });
      }
      return docsArray;
    };
    try {
      const result = await SettingsService.getProjectSettings();
      const settings = result.data;

      if (settings) {
        setProductVision(settings.documentation.product_vision || "");
        setProductScope(settings.documentation.product_scope || "");
        setSprintGoals(settings.documentation.sprint_goals || "");
        setGlossary(settings.documentation.glossary || "");
        setConstraints(settings.documentation.constraints || "");
        setGuidelines(settings.llm_context.guidelines || "");
        setAdditionalDocs(
          loadAdditionalDocs(settings.documentation.additional_docs)
        );
        setAdditionalContexts(
          loadAdditionalDocs(settings.llm_context.additional_contexts)
        );
      } else if (result.errors) {
        // setMsg(result.errors.toString());
        console.log("Error loading settings:", result.errors);
        setSuccess(false);
        setShowMsg(true);
      } else {
        setMsg("No settings found");
        setShowMsg(true);
      }
    } catch (err) {
      setMsg("Failed to load settings: " + err);
      console.log("Failed to load settings:", err);
      setSuccess(false);
      setShowMsg(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setShowMsg(false);
    setMsg("");
    try {
      const settings: ProjectSettings = {
        documentation: {
          product_vision: productVision,
          product_scope: productScope,
          sprint_goals: sprintGoals,
          glossary: glossary,
          constraints: constraints,
          additional_docs: additionalDocs.reduce(
            (acc, doc) => ({ ...acc, [doc.title]: doc.content }),
            {}
          ),
        },
        llm_context: {
          guidelines: guidelines,
          additional_contexts: additionalContexts.reduce(
            (acc, doc) => ({ ...acc, [doc.title]: doc.content }),
            {}
          ),
        },
      };

      const result = await SettingsService.setProjectSettings(settings);
      if (result.errors) {
        // setMsg(result.errors.toString());
        console.log("Error saving settings:", result.errors);
        setSuccess(false);
      } else {
        setMsg("Settings saved successfully");
        setSuccess(true);
      }
    } catch (err) {
      setMsg("Failed to save settings");
      console.log("Failed to save settings:", err);
      setSuccess(false);
    } finally {
      setShowMsg(true);
      setSaving(false);
    }
  };

  const addDocumentationSection = () => {
    const newId = `doc-${Date.now()}`;
    setAdditionalDocs([
      ...additionalDocs,
      { id: newId, title: "", content: "" },
    ]);
  };

  const removeDocumentationSection = (id: string) => {
    setAdditionalDocs(additionalDocs.filter((doc) => doc.id !== id));
  };

  const updateDocTitle = (id: string, title: string) => {
    setAdditionalDocs(
      additionalDocs.map((doc) => (doc.id === id ? { ...doc, title } : doc))
    );
  };

  const updateDocContent = (id: string, content: string) => {
    setAdditionalDocs(
      additionalDocs.map((doc) => (doc.id === id ? { ...doc, content } : doc))
    );
  };

  const closeMsg = () => {
    setShowMsg(false);
    setMsg("");
  };

  if (loading) {
    return (
      <Box
        xcss={{
          padding: "space.400",
          minHeight: "400px",
        }}
      >
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <Box
      xcss={{
        padding: "space.400",
        maxWidth: "900px",
      }}
    >
      {showMsg && (
        <Box
          xcss={{
            padding: "space.100",
            backgroundColor: success
              ? "color.background.success"
              : "color.background.danger",
            borderRadius: "border.radius",
            marginBottom: "space.400",
          }}
        >
          <SectionMessage
            appearance={success ? "success" : "error"}
            actions={[
              <SectionMessageAction onClick={closeMsg}>
                Close
              </SectionMessageAction>,
            ]}
          >
            <Text>{msg}</Text>
          </SectionMessage>
        </Box>
      )}
      <Stack space="space.400">
        <Heading size="large">Documentation</Heading>

        <Box>
          <Stack space="space.200">
            <SettingField
              label="Product Vision"
              value={productVision}
              onChange={setProductVision}
            />
            <SettingField
              label="Product Scope"
              value={productScope}
              onChange={setProductScope}
            />
            <SettingField
              label="Sprint Goals"
              value={sprintGoals}
              onChange={setSprintGoals}
            />
            <SettingField
              label="Glossary"
              value={glossary}
              onChange={setGlossary}
            />
            <SettingField
              label="Constraints"
              value={constraints}
              onChange={setConstraints}
            />
            <AdditionalSettingsSection
              additionalDocs={additionalDocs}
              setDocs={setAdditionalDocs}
              title="Additional Documentation"
            />
          </Stack>
        </Box>

        <Stack space="space.200">
          <Heading size="large">LLM Guidelines</Heading>
          <SettingField
            label="Guidelines"
            value={guidelines}
            onChange={setGuidelines}
          />
          <AdditionalSettingsSection
            additionalDocs={additionalContexts}
            setDocs={setAdditionalContexts}
            title="Additional Contexts"
          />
        </Stack>

        <Box>
          <Inline space="space.200">
            <LoadingButton
              onClick={saveSettings}
              appearance="primary"
              isLoading={saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </LoadingButton>
          </Inline>
        </Box>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Settings />
  </React.StrictMode>
);
