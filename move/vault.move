module vault::vault {
    use sui::transfer;
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    const ENoAccess: u64 = 1;

    /// One-Time-Witness for the module
    struct VAULT has drop {}

    /// Metadata for uploaded files
    struct FileMetadata has store, copy, drop {
        original_filename: String,
        file_size: u64,
        content_type: String,
        upload_timestamp: u64,
    }

    /// Metadata for uploaded notes
    struct NoteMetadata has store, copy, drop {
        title: String,
        content_size: u64,
        upload_timestamp: u64,
    }

    /// User File structure
    struct UserFile has key, store {
        id: UID,
        owner: address,
        walrus_blob_id: String,
        metadata: FileMetadata,
        enhanced_metadata: String, // JSON or encryption info
        secondary_blob_id: String,  // For partial encryption
        seal_encryption_id: String,
    }

    /// User Note structure
    struct UserNote has key, store {
        id: UID,
        owner: address,
        content_blob_id: String,
        metadata: NoteMetadata,
        enhanced_metadata: String,
        secondary_blob_id: String,
        seal_encryption_id: String,
    }

    /// Vault Store for managing all uploads
    struct VaultStore has key {
        id: UID,
        admin: address,
        files: vector<ID>,
        notes: vector<ID>,
        total_files: u64,
        total_notes: u64,
    }

    /// Events
    struct FileUploaded has copy, drop {
        file_id: ID,
        owner: address,
        walrus_blob_id: String,
    }

    struct NoteUploaded has copy, drop {
        note_id: ID,
        owner: address,
        content_blob_id: String,
    }

    /// Initialize the vault - called automatically when module is published
    fun init(_otw: VAULT, ctx: &mut TxContext) {
        // Create the main VaultStore
        let store = VaultStore {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            files: vector::empty<ID>(),
            notes: vector::empty<ID>(),
            total_files: 0,
            total_notes: 0,
        };
        transfer::share_object(store);
    }

    /// Create a new vault store (alternative manual creation)
    public fun create_vault(ctx: &mut TxContext) {
        let store = VaultStore {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            files: vector::empty<ID>(),
            notes: vector::empty<ID>(),
            total_files: 0,
            total_notes: 0,
        };
        transfer::share_object(store);
    }

    /// Upload a new file (internal function)
    public fun upload_file(
        store: &mut VaultStore,
        wallet_address: address,
        walrus_blob_id: vector<u8>,
        original_filename: vector<u8>,
        file_size: u64,
        content_type: vector<u8>,
        enhanced_metadata: vector<u8>,
        secondary_blob_id: vector<u8>,
        seal_encryption_id: vector<u8>,
        ctx: &mut TxContext
    ): UserFile {
        let file = UserFile {
            id: object::new(ctx),
            owner: wallet_address,
            walrus_blob_id: string::utf8(walrus_blob_id),
            metadata: FileMetadata {
                original_filename: string::utf8(original_filename),
                file_size,
                content_type: string::utf8(content_type),
                upload_timestamp: tx_context::epoch_timestamp_ms(ctx),
            },
            enhanced_metadata: string::utf8(enhanced_metadata),
            secondary_blob_id: string::utf8(secondary_blob_id),
            seal_encryption_id: string::utf8(seal_encryption_id),
        };

        let file_id = object::id(&file);
        vector::push_back(&mut store.files, file_id);
        store.total_files = store.total_files + 1;

        event::emit(FileUploaded {
            file_id,
            owner: wallet_address,
            walrus_blob_id: file.walrus_blob_id,
        });

        file
    }

    /// Upload a new file (entry function)
    entry fun upload_file_entry(
        store: &mut VaultStore,
        wallet_address: address,
        walrus_blob_id: vector<u8>,
        original_filename: vector<u8>,
        file_size: u64,
        content_type: vector<u8>,
        enhanced_metadata: vector<u8>,
        secondary_blob_id: vector<u8>,
        seal_encryption_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let file = upload_file(
            store,
            wallet_address,
            walrus_blob_id,
            original_filename,
            file_size,
            content_type,
            enhanced_metadata,
            secondary_blob_id,
            seal_encryption_id,
            ctx
        );
        transfer::share_object(file);
    }

    /// Upload a new note (internal function)
    public fun upload_note(
        store: &mut VaultStore,
        wallet_address: address,
        content_blob_id: vector<u8>,
        title: vector<u8>,
        content_size: u64,
        enhanced_metadata: vector<u8>,
        secondary_blob_id: vector<u8>,
        seal_encryption_id: vector<u8>,
        ctx: &mut TxContext
    ): UserNote {
        let note = UserNote {
            id: object::new(ctx),
            owner: wallet_address,
            content_blob_id: string::utf8(content_blob_id),
            metadata: NoteMetadata {
                title: string::utf8(title),
                content_size,
                upload_timestamp: tx_context::epoch_timestamp_ms(ctx),
            },
            enhanced_metadata: string::utf8(enhanced_metadata),
            secondary_blob_id: string::utf8(secondary_blob_id),
            seal_encryption_id: string::utf8(seal_encryption_id),
        };

        let note_id = object::id(&note);
        vector::push_back(&mut store.notes, note_id);
        store.total_notes = store.total_notes + 1;

        event::emit(NoteUploaded {
            note_id,
            owner: wallet_address,
            content_blob_id: note.content_blob_id,
        });

        note
    }

    /// Upload a new note (entry function)
    entry fun upload_note_entry(
        store: &mut VaultStore,
        wallet_address: address,
        content_blob_id: vector<u8>,
        title: vector<u8>,
        content_size: u64,
        enhanced_metadata: vector<u8>,
        secondary_blob_id: vector<u8>,
        seal_encryption_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let note = upload_note(
            store,
            wallet_address,
            content_blob_id,
            title,
            content_size,
            enhanced_metadata,
            secondary_blob_id,
            seal_encryption_id,
            ctx
        );
        transfer::share_object(note);
    }

    /// Verify file ownership
    public fun verify_file_ownership(file: &UserFile, caller: address): bool {
        file.owner == caller
    }

    /// Verify note ownership
    public fun verify_note_ownership(note: &UserNote, caller: address): bool {
        note.owner == caller
    }

    /// Access control for encrypted files (entry function)
    entry fun seal_approve_file_access(
        _id: vector<u8>,
        file: &UserFile,
        wallet_address: address,
        ctx: &TxContext
    ) {
        // Verify both transaction sender and provided wallet address match file owner
        let caller = tx_context::sender(ctx);
        assert!(file.owner == caller && file.owner == wallet_address, ENoAccess);
    }

    /// Access control for encrypted notes (entry function)
    entry fun seal_approve_note_access(
        _id: vector<u8>,
        note: &UserNote,
        wallet_address: address,
        ctx: &TxContext
    ) {
        // Verify both transaction sender and provided wallet address match note owner
        let caller = tx_context::sender(ctx);
        assert!(note.owner == caller && note.owner == wallet_address, ENoAccess);
    }

    /// Transfer file to another user
    public fun transfer_file(file: UserFile, to: address) {
        transfer::public_transfer(file, to);
    }

    /// Transfer note to another user
    public fun transfer_note(note: UserNote, to: address) {
        transfer::public_transfer(note, to);
    }

    /// Get file info (public view)
    public fun get_file_info(file: &UserFile): (String, String, u64, String, u64, address) {
        (
            file.walrus_blob_id,
            file.metadata.original_filename,
            file.metadata.file_size,
            file.metadata.content_type,
            file.metadata.upload_timestamp,
            file.owner
        )
    }

    /// Get note info (public view)
    public fun get_note_info(note: &UserNote): (String, String, u64, u64, address) {
        (
            note.content_blob_id,
            note.metadata.title,
            note.metadata.content_size,
            note.metadata.upload_timestamp,
            note.owner
        )
    }

    /// Get file encryption info (public view)
    public fun get_file_encryption_info(file: &UserFile): (String, String, String) {
        (file.enhanced_metadata, file.secondary_blob_id, file.seal_encryption_id)
    }

    /// Get note encryption info (public view)
    public fun get_note_encryption_info(note: &UserNote): (String, String, String) {
        (note.enhanced_metadata, note.secondary_blob_id, note.seal_encryption_id)
    }

    /// Check if file is partially encrypted (public view)
    public fun is_file_partially_encrypted(file: &UserFile): bool {
        !std::string::is_empty(&file.secondary_blob_id)
    }

    /// Check if note is partially encrypted (public view)
    public fun is_note_partially_encrypted(note: &UserNote): bool {
        !std::string::is_empty(&note.secondary_blob_id)
    }

    /// Get vault store statistics (public view)
    public fun get_vault_stats(store: &VaultStore): (address, u64, u64) {
        (store.admin, store.total_files, store.total_notes)
    }

    /// Check if caller is vault admin (public view)
    public fun is_vault_admin(store: &VaultStore, caller: address): bool {
        store.admin == caller
    }

    /// Get file metadata details (public view)
    public fun get_file_metadata(file: &UserFile): (String, u64, String, u64) {
        (
            file.metadata.original_filename,
            file.metadata.file_size,
            file.metadata.content_type,
            file.metadata.upload_timestamp
        )
    }

    /// Get note metadata details (public view)
    public fun get_note_metadata(note: &UserNote): (String, u64, u64) {
        (
            note.metadata.title,
            note.metadata.content_size,
            note.metadata.upload_timestamp
        )
    }
}