"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  PlusIcon,
  UserPlusIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  BLOOD_GROUP_OPTIONS,
  DEFAULT_WORK_LOCATIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  toDateInputValue,
} from "@/lib/user-profile-fields";
import {
  WIZARD_STEPS,
  WizardField,
  WizardStepper,
  WizardSelectField,
  WizardCreatableSelectField,
  wizardInputClass,
} from "@/components/team/wizard-ui";
import {
  buildReportingEmployeeChoices,
  type EmployeeOption,
} from "@/lib/team/employee-options";

export type TeammateFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  employeeCode: string;
  designation: string;
  role: string;
  officeBranch: string;
  reportsTo: string;
  joiningDate: string;
  dept: string;
  employmentStatus: string;
  workLocation: string;
  reportingHr: string;
  personalEmail: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type TeammateWizardMember = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  designation?: string;
  dept: string;
  reportsTo: string;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  personalEmail?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  employeeCode?: string | null;
  officeBranch?: string | null;
  workLocation?: string | null;
  joiningDate?: string | null;
  employmentStatus?: string | null;
  reportingHr?: string | null;
};

const EMPTY_FORM: TeammateFormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dateOfBirth: "",
  employeeCode: "",
  designation: "",
  role: "Editor",
  officeBranch: "",
  reportsTo: "None",
  joiningDate: "",
  dept: "Engineering",
  employmentStatus: "Active",
  workLocation: "Remote",
  reportingHr: "None",
  personalEmail: "",
  bloodGroup: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function memberToForm(member: TeammateWizardMember): TeammateFormValues {
  return {
    name: member.name,
    email: member.email,
    phone: member.phone || "",
    password: "",
    confirmPassword: "",
    dateOfBirth: toDateInputValue(member.dateOfBirth),
    employeeCode: member.employeeCode || "",
    designation: member.designation || "",
    role: member.role,
    officeBranch: member.officeBranch || "",
    reportsTo: member.reportsTo || "None",
    joiningDate: toDateInputValue(member.joiningDate),
    dept: member.dept || "Engineering",
    employmentStatus: member.employmentStatus || "Active",
    workLocation: member.workLocation || "Remote",
    reportingHr: member.reportingHr || "None",
    personalEmail: member.personalEmail || "",
    bloodGroup: member.bloodGroup || "",
    emergencyContactName: member.emergencyContactName || "",
    emergencyContactPhone: member.emergencyContactPhone || "",
  };
}

export function TeammateWizardModal({
  open,
  mode,
  member,
  workspaceId,
  roles,
  departments,
  designations,
  branches,
  locations,
  employees,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  member?: TeammateWizardMember | null;
  workspaceId: number;
  roles: string[];
  departments: string[];
  designations: string[];
  branches: string[];
  locations: string[];
  employees: EmployeeOption[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TeammateFormValues) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<TeammateFormValues>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localDesignations, setLocalDesignations] = useState<string[]>(designations);
  const [localBranches, setLocalBranches] = useState<string[]>(branches);
  const [localLocations, setLocalLocations] = useState<string[]>(locations);
  const [localDepartments, setLocalDepartments] = useState<string[]>(departments);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm(mode === "edit" && member ? memberToForm(member) : EMPTY_FORM);
    setLocalDesignations(designations);
    setLocalBranches(branches);
    setLocalLocations(locations.length ? locations : [...DEFAULT_WORK_LOCATIONS]);
    setLocalDepartments(departments);
  }, [open, mode, member, designations, branches, locations, departments]);

  const title = mode === "add" ? "Add Teammate Record" : "Edit Teammate Details";
  const TitleIcon = mode === "add" ? UserPlusIcon : PencilSquareIcon;

  const patchForm = (patch: Partial<TeammateFormValues>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const validateStep = (currentStep: number): string | null => {
    if (currentStep === 1) {
      if (!form.name.trim()) return "Full name is required.";
      if (!form.email.trim()) return "Work email is required.";
      if (mode === "add") {
        if (!form.password) return "Password is required.";
        if (form.password !== form.confirmPassword) return "Passwords do not match.";
      } else if (form.password && form.password !== form.confirmPassword) {
        return "Passwords do not match.";
      }
      const digits = (form.phone || "").replace(/\D/g, "");
      if (digits.length > 0 && (digits.length < 8 || digits.length > 15)) {
        return "Please enter a valid phone number.";
      }
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      alert(error);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleSubmit = async () => {
    for (let i = 1; i <= 3; i += 1) {
      const error = validateStep(i);
      if (error) {
        setStep(i);
        alert(error);
        return;
      }
    }
    await onSubmit(form);
  };

  const managerChoices = useMemo(
    () =>
      buildReportingEmployeeChoices(employees, {
        excludeId: mode === "edit" && member ? member.id : null,
        includeValues: [form.reportsTo],
      }),
    [employees, form.reportsTo, member, mode]
  );

  const hrChoices = useMemo(
    () =>
      buildReportingEmployeeChoices(employees, {
        excludeId: mode === "edit" && member ? member.id : null,
        includeValues: [form.reportingHr],
      }),
    [employees, form.reportingHr, member, mode]
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm dark:bg-black/50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="fixed inset-0 z-50 m-auto flex h-fit max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121418]"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-white/5">
            <div className="flex items-center gap-2">
              <TitleIcon className="h-5 w-5 text-[var(--app-primary)]" />
              <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-5">
            <WizardStepper steps={WIZARD_STEPS} currentStep={step} />

            <div className="mt-6 space-y-4">
              {step === 1 && (
                <>
                  <WizardField label="Full Name">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => patchForm({ name: e.target.value })}
                      className={wizardInputClass}
                      placeholder="e.g. Rahul Raj"
                    />
                  </WizardField>
                  <WizardField label="Work Email Address">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => patchForm({ email: e.target.value })}
                      className={wizardInputClass}
                      placeholder="e.g. rahul@company.com"
                    />
                  </WizardField>
                  {mode === "add" && (
                    <>
                      <WizardField label="Password">
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={(e) => patchForm({ password: e.target.value })}
                            className={`${wizardInputClass} pr-10`}
                            placeholder="Create teammate password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-4.5 w-4.5" />
                            ) : (
                              <EyeIcon className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                      </WizardField>
                      <WizardField label="Confirm Password">
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={form.confirmPassword}
                            onChange={(e) => patchForm({ confirmPassword: e.target.value })}
                            className={`${wizardInputClass} pr-10`}
                            placeholder="Repeat password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="h-4.5 w-4.5" />
                            ) : (
                              <EyeIcon className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                      </WizardField>
                    </>
                  )}
                  <WizardField label="Phone Number">
                    <PhoneInput
                      country="in"
                      value={form.phone}
                      onChange={(value) => patchForm({ phone: value ? `+${value}` : "" })}
                      enableSearch
                      countryCodeEditable={false}
                      inputProps={{ name: "phone", placeholder: "Enter phone number" }}
                    />
                  </WizardField>
                  <WizardField label="Date of Birth">
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => patchForm({ dateOfBirth: e.target.value })}
                      className={wizardInputClass}
                    />
                  </WizardField>
                </>
              )}

              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <WizardField label="Teammate Code">
                    <input
                      type="text"
                      value={form.employeeCode}
                      onChange={(e) => patchForm({ employeeCode: e.target.value })}
                      className={wizardInputClass}
                      placeholder="e.g. ANSH-005"
                    />
                  </WizardField>
                  <WizardField label="Joining Date">
                    <input
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => patchForm({ joiningDate: e.target.value })}
                      className={wizardInputClass}
                    />
                  </WizardField>
                  <WizardCreatableSelectField
                    label="Designation"
                    value={form.designation}
                    onChange={(value) => patchForm({ designation: value })}
                    options={localDesignations}
                    onOptionsChange={setLocalDesignations}
                    placeholder="Select designation"
                    addPlaceholder="New designation"
                  />
                  <WizardSelectField
                    label="Security Access Role"
                    value={form.role}
                    onChange={(value) => patchForm({ role: value })}
                    options={roles}
                  />
                  <WizardCreatableSelectField
                    label="Department"
                    value={form.dept}
                    onChange={(value) => patchForm({ dept: value })}
                    options={localDepartments}
                    onOptionsChange={setLocalDepartments}
                    placeholder="Select department"
                    addPlaceholder="New department"
                  />
                  <WizardSelectField
                    label="Employment Status"
                    value={form.employmentStatus}
                    onChange={(value) => patchForm({ employmentStatus: value })}
                    options={[...EMPLOYMENT_STATUS_OPTIONS]}
                  />
                  <WizardCreatableSelectField
                    label="Office Branch"
                    value={form.officeBranch}
                    onChange={(value) => patchForm({ officeBranch: value })}
                    options={localBranches}
                    onOptionsChange={setLocalBranches}
                    placeholder="Select branch"
                    addPlaceholder="New branch"
                  />
                  <WizardCreatableSelectField
                    label="Work Location"
                    value={form.workLocation}
                    onChange={(value) => patchForm({ workLocation: value })}
                    options={localLocations}
                    onOptionsChange={setLocalLocations}
                    placeholder="Select location"
                    addPlaceholder="New location"
                  />
                  <WizardSelectField
                    label="Reporting Manager"
                    value={form.reportsTo}
                    onChange={(value) => patchForm({ reportsTo: value })}
                    options={managerChoices}
                    placeholder="Select manager"
                  />
                  <WizardSelectField
                    label="Reporting HR"
                    value={form.reportingHr}
                    onChange={(value) => patchForm({ reportingHr: value })}
                    options={hrChoices}
                    placeholder="Select HR manager"
                  />
                </div>
              )}

              {step === 3 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <WizardField label="Personal Email Address">
                      <input
                        type="email"
                        value={form.personalEmail}
                        onChange={(e) => patchForm({ personalEmail: e.target.value })}
                        className={wizardInputClass}
                        placeholder="personal@email.com"
                      />
                    </WizardField>
                    <WizardSelectField
                      label="Blood Group"
                      value={form.bloodGroup}
                      onChange={(value) => patchForm({ bloodGroup: value })}
                      options={[...BLOOD_GROUP_OPTIONS]}
                      placeholder="Select blood group"
                    />
                  </div>
                  <p className="pt-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Emergency Contacts Details
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <WizardField label="Contact Name">
                      <input
                        type="text"
                        value={form.emergencyContactName}
                        onChange={(e) => patchForm({ emergencyContactName: e.target.value })}
                        className={wizardInputClass}
                        placeholder="e.g. Sibling or Parent Name"
                      />
                    </WizardField>
                    <WizardField label="Contact Phone">
                      <PhoneInput
                        country="in"
                        value={form.emergencyContactPhone}
                        onChange={(value) =>
                          patchForm({ emergencyContactPhone: value ? `+${value}` : "" })
                        }
                        enableSearch
                        countryCodeEditable={false}
                        inputProps={{ name: "emergencyPhone", placeholder: "Emergency phone" }}
                      />
                    </WizardField>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4 dark:border-white/5">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 dark:border-white/10 dark:text-zinc-300"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 dark:border-white/10 dark:text-zinc-300"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110"
              >
                Next Step
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="rounded-xl bg-[var(--app-primary)] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-60"
              >
                {submitting
                  ? "Saving..."
                  : mode === "add"
                  ? "Add Teammate"
                  : "Update Member Details"}
              </button>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
