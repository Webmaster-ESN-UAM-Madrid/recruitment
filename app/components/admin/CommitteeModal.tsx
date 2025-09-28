import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { HexColorPicker } from "react-colorful";
import styled from "styled-components";
import { SaveButton } from "@/app/components/buttons/SaveButton";
import { CancelButton } from "@/app/components/buttons/CancelButton";

interface CommitteeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (committee: { name: string; color: string; _id?: string }) => void;
  editingCommittee: { name: string; color: string; _id: string } | null;
}

const ColorPickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const CommitteeModal: React.FC<CommitteeModalProps> = ({
  open,
  onClose,
  onSave,
  editingCommittee
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#aabbcc");

  useEffect(() => {
    if (editingCommittee) {
      setName(editingCommittee.name);
      setColor(editingCommittee.color);
    } else {
      setName("");
      setColor("#aabbcc");
    }
  }, [editingCommittee, open]);

  const handleSave = () => {
    onSave({ name, color, _id: editingCommittee?._id });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingCommittee ? "Editar Comité" : "Añadir Comité"}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nombre del Comité"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <ColorPickerContainer>
          <HexColorPicker color={color} onChange={setColor} />
          <TextField
            margin="dense"
            label="Color Hexadecimal"
            type="text"
            fullWidth
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ marginTop: "10px" }}
          />
        </ColorPickerContainer>
      </DialogContent>
      <DialogActions>
        <CancelButton onClick={onClose} />
        <SaveButton onClick={handleSave} />
      </DialogActions>
    </Dialog>
  );
};

export default CommitteeModal;
